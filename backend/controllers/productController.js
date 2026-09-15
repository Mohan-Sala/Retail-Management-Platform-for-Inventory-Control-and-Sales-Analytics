const productService = require("../services/productService");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const dashboardAnalyticsService = require("../services/dashboardAnalyticsService");

const getAuditTimestamp = () => new Date().toISOString().replace('T', ' ').split('.')[0];

/**
 * @desc Get all products
 * @route GET /api/products
 */
const getProducts = async (req, res, next) => {
  try {
    const queryOptions = { ...req.query };
    
    // Scoping for vendors: force vendorId to match logged-in vendor's ID
    if (req.user && req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        throw new ApiError(404, "Vendor profile not found for this user");
      }
      queryOptions.vendorId = vendor._id.toString();
    }

    const { search, category, status, vendorId, sortBy, order, page, limit } = queryOptions;
    const result = await productService.getAllProducts({ search, category, status, vendorId, sortBy, order, page, limit });
    res.status(200).json(new ApiResponse(200, result, "Products retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single product by ID
 * @route GET /api/products/:id
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json(new ApiResponse(200, product, "Product retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create product
 * @route POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (!req.user) {
      throw new ApiError(401, "Not authorized");
    }

    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor) {
        throw new ApiError(404, "Vendor profile not found for this user");
      }
      data.vendorId = vendor._id.toString();
    } else if (req.user.role !== "admin") {
      throw new ApiError(403, "Not authorized to create products");
    }

    const product = await productService.createProduct(data);
    dashboardAnalyticsService.invalidateDashboardCache();

    // Audit Logging
    console.log(`[AUDIT]\n${getAuditTimestamp()}\nUser: ${req.user.email}\nRole: ${req.user.role}\nIP: ${req.ip}\nOperation: CREATE\nEntity: Product\nID: ${product.id}`);

    res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update product
 * @route PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Not authorized");
    }

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      throw new ApiError(404, "Product not found");
    }

    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor || existingProduct.vendorId.toString() !== vendor._id.toString()) {
        throw new ApiError(403, "Not authorized to edit this product");
      }
      req.body.vendorId = vendor._id.toString();
    } else if (req.user.role !== "admin") {
      throw new ApiError(403, "Not authorized to edit products");
    }

    const product = await productService.updateProduct(req.params.id, req.body);
    dashboardAnalyticsService.invalidateDashboardCache();

    const wishlistService = require("../services/wishlistService");
    wishlistService.checkProductUpdates(
      existingProduct._id,
      existingProduct.price,
      existingProduct.stock,
      product.price,
      product.stock
    ).catch(e => console.error("Wishlist notifications alert failed:", e));

    // Audit Logging
    console.log(`[AUDIT]\n${getAuditTimestamp()}\nUser: ${req.user.email}\nRole: ${req.user.role}\nIP: ${req.ip}\nOperation: UPDATE\nEntity: Product\nID: ${product.id}`);

    res.status(200).json(new ApiResponse(200, product, "Product updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete product
 * @route DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Not authorized");
    }

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      throw new ApiError(404, "Product not found");
    }

    if (req.user.role === "vendor") {
      const vendor = await Vendor.findOne({ email: req.user.email });
      if (!vendor || existingProduct.vendorId.toString() !== vendor._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this product");
      }
    } else if (req.user.role !== "admin") {
      throw new ApiError(403, "Not authorized to delete products");
    }

    const product = await productService.deleteProduct(req.params.id);
    dashboardAnalyticsService.invalidateDashboardCache();

    // Audit Logging
    console.log(`[AUDIT]\n${getAuditTimestamp()}\nUser: ${req.user.email}\nRole: ${req.user.role}\nIP: ${req.ip}\nOperation: DELETE\nEntity: Product\nID: ${product.id}`);

    res.status(200).json(new ApiResponse(200, product, "Product deleted successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
