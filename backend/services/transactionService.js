const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const ApiError = require("../utils/ApiError");
const { generateOrderNumber } = require("../utils/orderUtils");

/**
 * @desc Helper function to format transaction document for client consumption
 */
const formatTransaction = (tx) => {
  if (!tx) return null;
  const doc = tx.toObject ? tx.toObject() : tx;

  let vendorName = "";
  let vendorIdVal = "";
  if (doc.vendorId) {
    if (typeof doc.vendorId === "object" && doc.vendorId.businessName) {
      vendorName = doc.vendorId.businessName;
      vendorIdVal = doc.vendorId._id.toString();
    } else {
      vendorIdVal = doc.vendorId.toString();
    }
  }

  let productName = "";
  let productIdVal = "";
  if (doc.productId) {
    if (typeof doc.productId === "object" && doc.productId.name) {
      productName = doc.productId.name;
      productIdVal = doc.productId._id.toString();
    } else {
      productIdVal = doc.productId.toString();
    }
  }

  return {
    id: doc._id.toString(),
    orderNo: doc.orderNo,
    customer: doc.customer,
    vendorId: vendorIdVal,
    vendorName: vendorName,
    productId: productIdVal,
    productName: productName,
    qty: doc.qty,
    amount: doc.amount,
    status: doc.status,
    paymentMethod: doc.paymentMethod,
    date: doc.date,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

/**
 * @desc Fetch all transactions with filters (vendorId, status) and pagination
 */
const getAllTransactions = async (queryOptions) => {
  const { vendorId, status, sortBy = "date", order = "desc", page = 1, limit = 150 } = queryOptions;

  const filter = {};

  if (vendorId) filter.vendorId = vendorId;
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortDirection = order === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortDirection };

  const total = await Transaction.countDocuments(filter);
  const transactions = await Transaction.find(filter)
    .populate("vendorId", "businessName")
    .populate("productId", "name")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  return {
    transactions: transactions.map(formatTransaction),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)) || 1,
    limit: parseInt(limit),
  };
};

/**
 * @desc Get transaction by ID
 */
const getTransactionById = async (id) => {
  const tx = await Transaction.findById(id)
    .populate("vendorId", "businessName")
    .populate("productId", "name");
  if (!tx) {
    throw new ApiError(404, "Transaction not found");
  }
  return formatTransaction(tx);
};

/**
 * @desc Execute checking out a transaction atomically inside a MongoDB transaction session
 */
const executeCheckoutTransaction = async (session, txData) => {
  const { customerId, vendorId, productId, qty, paymentMethod, status = "paid" } = txData;

  // 1. Verify Customer exists and is active
  const Customer = require("../models/Customer");
  const customerDoc = await Customer.findById(customerId).session(session);
  if (!customerDoc) {
    throw new ApiError(404, "Customer not found");
  }
  if (!customerDoc.isActive) {
    throw new ApiError(400, "Customer account is suspended or inactive");
  }

  // 2. Verify Product exists and has sufficient stock
  const product = await Product.findById(productId).session(session);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  if (product.status === "inactive") {
    throw new ApiError(400, "Product is currently inactive");
  }
  if (product.stock < qty) {
    throw new ApiError(400, `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${qty}`);
  }

  // 3. Verify Vendor exists
  const vendor = await Vendor.findById(vendorId).session(session);
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  // 4. Verify Product belongs to Vendor
  if (product.vendorId.toString() !== vendorId.toString()) {
    throw new ApiError(400, "The requested product does not belong to the selected vendor");
  }

  // 5. Compute price and total (Secure Amount Calculation)
  const price = product.price;
  const amount = price * qty;

  // 6. Generate unique order number and verify uniqueness
  let orderNo;
  let orderNoExists = true;
  let attempts = 0;
  while (orderNoExists && attempts < 5) {
    orderNo = generateOrderNumber();
    const existing = await Transaction.findOne({ orderNo }).session(session);
    if (!existing) {
      orderNoExists = false;
    }
    attempts++;
  }
  if (orderNoExists) {
    throw new ApiError(500, "Could not generate a unique order number. Please try again.");
  }

  // 7. Create transaction
  const [transaction] = await Transaction.create(
    [
      {
        orderNo,
        customerId,
        customer: customerDoc.name,
        vendorId,
        productId,
        qty,
        amount,
        status,
        paymentMethod,
        date: new Date(),
      },
    ],
    { session }
  );

  // 8. Deduct product stock and increase sales (only if transaction is paid/completed)
  if (status === "paid") {
    product.stock -= qty;
    product.sales += qty;
    if (product.stock === 0) {
      product.status = "out_of_stock";
    }
    await product.save({ session });

    // 8b. Deduct Inventory stock and synchronize
    const Inventory = require("../models/Inventory");
    let inventory = await Inventory.findOne({ productId }).session(session);
    if (!inventory) {
      await Inventory.create(
        [
          {
            productId,
            currentStock: product.stock, // already decremented above
            minimumStock: product.reorderLevel || 10,
            maximumStock: product.stock > 100 ? product.stock + 50 : 100,
          },
        ],
        { session }
      );
    } else {
      inventory.currentStock -= qty;
      if (inventory.currentStock < 0) {
        inventory.currentStock = 0;
      }
      await inventory.save({ session });
    }
  }

  // 9. Accumulate vendor revenue if transaction is paid
  if (status === "paid") {
    vendor.revenue += amount;
    await vendor.save({ session });
  }

  // 10. Update customer statistics if transaction is paid
  if (status === "paid") {
    customerDoc.totalOrders += 1;
    customerDoc.totalSpending += amount;
    customerDoc.lastPurchaseDate = new Date();
    await customerDoc.save({ session });
  }

  require("./forecastingService").clearForecastCache();
  return transaction;
};

/**
 * @desc Create Transaction wrapper handling sessions and rollback fallback
 */
const createTransaction = async (txData) => {
  const session = await mongoose.startSession();
  let createdTx;

  try {
    await session.withTransaction(async () => {
      createdTx = await executeCheckoutTransaction(session, txData);
    });
  } catch (error) {
    // Check if error is due to MongoDB environment not supporting sessions/transactions
    const isSessionUnsupported =
      error.message &&
      (error.message.includes("does not support transactions") ||
        error.message.includes("replica set") ||
        error.code === 20 || // TransactionSystemFailed
        error.code === 251); // NoMatchingTransaction

    if (isSessionUnsupported) {
      console.warn("MongoDB transactions are not supported by this environment. Executing in non-transactional fallback mode.");
      
      // Standalone/Fallback execution (non-atomic)
      const fakeSession = null;
      createdTx = await executeCheckoutTransaction(fakeSession, txData);
    } else {
      // Re-throw if it's a validation error or insufficient stock
      throw error;
    }
  } finally {
    session.endSession();
  }

  // Retrieve fully populated transaction document
  const populatedTx = await Transaction.findById(createdTx._id)
    .populate("vendorId", "businessName")
    .populate("productId", "name");

  return formatTransaction(populatedTx);
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  executeCheckoutTransaction,
  formatTransaction,
};
