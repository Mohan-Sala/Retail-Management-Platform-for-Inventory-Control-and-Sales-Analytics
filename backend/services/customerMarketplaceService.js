const Product = require("../models/Product");
const User = require("../models/User");
const Vendor = require("../models/Vendor");

/**
 * @desc Get catalog list filtered by stock > 0, status == active, and active non-deleted vendors
 */
const getMarketplaceProducts = async (filters = {}) => {
  const {
    q = "",
    category = "",
    minPrice,
    maxPrice,
    vendorId,
    sortBy = "newest",
    page = 1,
    limit = 12,
  } = filters;

  // 1. Get non-deleted vendors
  const activeVendors = await Vendor.find({
    deletedAt: null,
  }).select("_id");
  const vendorIds = activeVendors.map(v => v._id);

  if (vendorIds.length === 0) {
    return { products: [], total: 0, pages: 0, page, limit };
  }

  // 2. Build query
  const query = {
    deletedAt: null,
    status: "active",
    stock: { $gt: 0 },
    vendorId: { $in: vendorIds },
  };

  if (vendorId) {
    const parsedVendorId = String(vendorId);
    const isValidVendor = vendorIds.some(id => id.toString() === parsedVendorId);
    if (!isValidVendor) {
      return { products: [], total: 0, pages: 0, page, limit };
    }
    query.vendorId = vendorId;
  }

  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }

  // 3. Sorting
  let sortOptions = {};
  if (sortBy === "priceAsc") {
    sortOptions.price = 1;
  } else if (sortBy === "priceDesc") {
    sortOptions.price = -1;
  } else if (sortBy === "salesDesc") {
    sortOptions.sales = -1;
  } else if (sortBy === "nameAsc") {
    sortOptions.name = 1;
  } else if (sortBy === "ratingDesc") {
    sortOptions.averageRating = -1;
  } else {
    sortOptions.createdAt = -1;
  }

  // 4. Pagination
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .populate("vendorId", "businessName name email avatar")
    .lean();

  return {
    products: products.map(p => ({
      ...p,
      vendorShopName: p.vendorId?.businessName || p.vendorId?.name || "ShopSense Partner",
    })),
    total,
    pages: Math.ceil(total / Number(limit)),
    page: Number(page),
    limit: Number(limit),
  };
};

/**
 * @desc Get single product details ensuring active vendor visibility
 */
const getMarketplaceProductDetails = async (id) => {
  const product = await Product.findOne({ _id: id, deletedAt: null, status: "active" })
    .populate("vendorId", "businessName name email status deletedAt")
    .lean();

  if (!product) {
    return null;
  }

  if (
    !product.vendorId ||
    product.vendorId.deletedAt
  ) {
    return null;
  }

  return {
    ...product,
    vendorShopName: product.vendorId.businessName || product.vendorId.name || "ShopSense Partner",
  };
};

module.exports = {
  getMarketplaceProducts,
  getMarketplaceProductDetails,
};
