const mongoose = require("mongoose");
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const ApiError = require("../utils/ApiError");

/**
 * @desc Format inventory document for client consumption
 */
const formatInventory = (item) => {
  if (!item) return null;
  const doc = item.toObject ? item.toObject() : item;
  
  let p = doc.productId;
  let v = p && p.vendorId;

  return {
    id: doc._id.toString(),
    productId: p && p._id ? p._id.toString() : (p ? p.toString() : ""),
    productName: p && p.name ? p.name : "Unknown Product",
    sku: p && p.sku ? p.sku : "N/A",
    category: p && p.category ? p.category : "N/A",
    image: p && p.image ? p.image : "https://picsum.photos/seed/default/400/400",
    vendorId: v && v._id ? v._id.toString() : (v ? v.toString() : ""),
    vendorName: v && v.businessName ? v.businessName : "Unknown Vendor",
    currentStock: doc.currentStock,
    minimumStock: doc.minimumStock,
    maximumStock: doc.maximumStock,
    status: item.status, // Calculated virtual property
    lastUpdated: doc.lastUpdated,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

/**
 * @desc Get all inventory with sorting, searching, pagination, and vendor scoping
 */
const getAllInventory = async (queryOptions) => {
  const { search, vendorId, category, status, sortBy = "lastUpdated", order = "desc", page = 1, limit = 10 } = queryOptions;

  const filter = {};

  // 1. Build product-based query filter
  const productFilter = {};
  if (vendorId) {
    productFilter.vendorId = vendorId;
  }
  if (category) {
    productFilter.category = category;
  }
  if (search) {
    // Search matching vendors if search query matches vendor name
    const vendors = await Vendor.find({
      businessName: { $regex: search, $options: "i" }
    });
    const matchingVendorIds = vendors.map(v => v._id);

    productFilter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { vendorId: { $in: matchingVendorIds } }
    ];
  }

  // Resolve matching product IDs
  if (Object.keys(productFilter).length > 0) {
    const products = await Product.find(productFilter);
    const productIds = products.map(p => p._id);
    filter.productId = { $in: productIds };
  }

  // 2. Build status queries at database level
  if (status) {
    if (status === "Out of Stock") {
      filter.currentStock = 0;
    } else if (status === "Low Stock") {
      filter.currentStock = { $gt: 0 };
      filter.$expr = { $lte: ["$currentStock", "$minimumStock"] };
    } else if (status === "Healthy") {
      filter.currentStock = { $gt: 0 };
      filter.$expr = { $gt: ["$currentStock", "$minimumStock"] };
    }
  }

  // 3. Fetch matching inventory documents from database
  let inventories = await Inventory.find(filter)
    .populate({
      path: "productId",
      populate: { path: "vendorId", select: "businessName" }
    });

  // 4. In-memory sorting for product name property
  const sortDirection = order === "asc" ? 1 : -1;
  inventories.sort((a, b) => {
    let valA, valB;
    if (sortBy === "productName") {
      valA = a.productId?.name || "";
      valB = b.productId?.name || "";
      return sortDirection * valA.localeCompare(valB);
    } else if (sortBy === "currentStock") {
      valA = a.currentStock;
      valB = b.currentStock;
    } else {
      valA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      valB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
    }
    return valA > valB ? sortDirection : valA < valB ? -sortDirection : 0;
  });

  // 5. In-memory pagination
  const total = inventories.length;
  const limitVal = parseInt(limit);
  const pageVal = parseInt(page);
  const skip = (pageVal - 1) * limitVal;
  const paginated = inventories.slice(skip, skip + limitVal);

  return {
    inventory: paginated.map(formatInventory),
    total,
    page: pageVal,
    pages: Math.ceil(total / limitVal) || 1,
    limit: limitVal,
  };
};

/**
 * @desc Get inventory record by ID
 */
const getInventoryById = async (id) => {
  const item = await Inventory.findById(id).populate({
    path: "productId",
    populate: { path: "vendorId", select: "businessName" }
  });
  if (!item) {
    throw new ApiError(404, "Inventory record not found");
  }
  return formatInventory(item);
};

/**
 * @desc Create inventory record
 */
const createInventory = async (inventoryData) => {
  const { productId, minimumStock = 10, maximumStock = 100 } = inventoryData;

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Referenced Product does not exist");
  }

  // Enforce one inventory record per product
  const exists = await Inventory.findOne({ productId });
  if (exists) {
    throw new ApiError(400, "Inventory record already exists for this product");
  }

  const currentStock = product.stock || 0;

  const item = await Inventory.create({
    productId,
    currentStock,
    minimumStock,
    maximumStock,
  });

  const populated = await Inventory.findById(item._id).populate({
    path: "productId",
    populate: { path: "vendorId", select: "businessName" }
  });
  require("./forecastingService").clearForecastCache();
  return formatInventory(populated);
};

/**
 * @desc Update inventory configuration (Admin only: min & max stock only)
 */
const updateInventory = async (id, updateData) => {
  const { minimumStock, maximumStock } = updateData;

  // Retrieve current inventory configuration
  const item = await Inventory.findById(id);
  if (!item) {
    throw new ApiError(404, "Inventory record not found");
  }

  if (minimumStock !== undefined) item.minimumStock = minimumStock;
  if (maximumStock !== undefined) item.maximumStock = maximumStock;

  await item.save();

  const populated = await Inventory.findById(item._id).populate({
    path: "productId",
    populate: { path: "vendorId", select: "businessName" }
  });
  require("./forecastingService").clearForecastCache();
  return formatInventory(populated);
};

module.exports = {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  formatInventory,
};
