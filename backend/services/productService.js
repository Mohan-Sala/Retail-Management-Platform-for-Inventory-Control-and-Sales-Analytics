const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const ApiError = require("../utils/ApiError");

/**
 * @desc Helper function to format product document for client consumption
 */
const formatProduct = (product) => {
  if (!product) return null;
  const doc = product.toObject ? product.toObject() : product;

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

  return {
    id: doc._id.toString(),
    name: doc.name,
    sku: doc.sku,
    category: doc.category,
    price: doc.price,
    stock: doc.stock,
    reorderLevel: doc.reorderLevel,
    vendorId: vendorIdVal,
    vendorName: vendorName,
    status: doc.status,
    image: doc.image,
    description: doc.description,
    sales: doc.sales,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

/**
 * @desc Fetch all products with searching, sorting, filtering, and pagination
 */
const getAllProducts = async (queryOptions) => {
  const { search, category, status, vendorId, sortBy = "createdAt", order = "desc", page = 1, limit = 10 } = queryOptions;

  const filter = {};

  // Apply filters
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (vendorId) filter.vendorId = vendorId;

  // Apply search
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Sorting
  const sortDirection = order === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortDirection };

  // Run queries
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("vendorId", "businessName")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  return {
    products: products.map(formatProduct),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)) || 1,
    limit: parseInt(limit),
  };
};

/**
 * @desc Get Product by ID
 */
const getProductById = async (id) => {
  const product = await Product.findById(id).populate("vendorId", "businessName");
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  return formatProduct(product);
};

/**
 * @desc Create Product
 */
const createProduct = async (productData) => {
  const { sku, vendorId } = productData;

  // Verify Vendor exists
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, "Referenced Vendor does not exist");
  }

  // Check SKU uniqueness
  const skuExists = await Product.findOne({ sku });
  if (skuExists) {
    throw new ApiError(409, `Product SKU '${sku}' already exists`);
  }

  // Create Product
  const product = await Product.create(productData);

  // Automatically create Inventory record
  const Inventory = require("../models/Inventory");
  await Inventory.create({
    productId: product._id,
    currentStock: product.stock || 0,
    minimumStock: product.reorderLevel || 10,
    maximumStock: product.stock > 100 ? product.stock + 50 : 100,
  });

  // Increment productCount in Vendor document
  await Vendor.findByIdAndUpdate(vendorId, { $inc: { productCount: 1 } });

  // Fetch created product populated
  const populatedProduct = await Product.findById(product._id).populate("vendorId", "businessName");
  require("./forecastingService").clearForecastCache();
  return formatProduct(populatedProduct);
};

/**
 * @desc Update Product
 */
const updateProduct = async (id, productData) => {
  const { sku, vendorId } = productData;

  // Validate vendor if updating
  if (vendorId) {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      throw new ApiError(404, "Referenced Vendor does not exist");
    }
  }

  // Check SKU uniqueness
  if (sku) {
    const skuExists = await Product.findOne({ sku, _id: { $ne: id } });
    if (skuExists) {
      throw new ApiError(409, `Product SKU '${sku}' already exists`);
    }
  }

  // If status is active but stock is 0, auto-switch status to out_of_stock
  if (productData.stock !== undefined) {
    if (parseInt(productData.stock) === 0) {
      productData.status = "out_of_stock";
    } else if (productData.status === "out_of_stock" && parseInt(productData.stock) > 0) {
      productData.status = "active";
    }
  }

  const product = await Product.findByIdAndUpdate(id, productData, {
    new: true,
    runValidators: true,
  }).populate("vendorId", "businessName");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Automatically synchronize with the corresponding Inventory document
  const Inventory = require("../models/Inventory");
  const inventoryUpdate = {};
  if (productData.stock !== undefined) {
    inventoryUpdate.currentStock = parseInt(productData.stock);
    
    // Ensure maximumStock is at least equal to currentStock to avoid validation constraints
    const currentInv = await Inventory.findOne({ productId: id });
    if (currentInv && currentInv.maximumStock < parseInt(productData.stock)) {
      inventoryUpdate.maximumStock = parseInt(productData.stock) + 50;
    }
  }
  if (productData.reorderLevel !== undefined) {
    inventoryUpdate.minimumStock = parseInt(productData.reorderLevel);
  }

  if (Object.keys(inventoryUpdate).length > 0) {
    await Inventory.findOneAndUpdate(
      { productId: id },
      { $set: inventoryUpdate },
      { new: true, runValidators: true, upsert: true }
    );
  }

  require("./forecastingService").clearForecastCache();
  return formatProduct(product);
};

/**
 * @desc Delete Product
 */
const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await Product.findByIdAndDelete(id);

  // Decrement productCount in Vendor document
  // Clean up inventory document to prevent orphans
  const Inventory = require("../models/Inventory");
  await Inventory.deleteOne({ productId: id });

  require("./forecastingService").clearForecastCache();
  return formatProduct(product);
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  formatProduct, // export format helper for reuse
};
