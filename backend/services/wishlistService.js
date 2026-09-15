const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const cartService = require("./cartService");
const recommendationService = require("./recommendationService");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

const getOrCreateWishlist = async (customerId) => {
  let list = await Wishlist.findOne({ customerId });
  if (!list) {
    list = await Wishlist.create({ customerId, items: [] });
  }
  return list;
};

/**
 * @desc Fetch wishlist populate details
 */
const getWishlist = async (customerId) => {
  await getOrCreateWishlist(customerId);
  return Wishlist.findOne({ customerId })
    .populate("items.productId", "name price image category stock isActive")
    .lean();
};

/**
 * @desc Add product to wishlist
 */
const addToWishlist = async (customerId, productId) => {
  const product = await Product.findOne({ _id: productId, deletedAt: null });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const list = await getOrCreateWishlist(customerId);
  const exists = list.items.some(item => item.productId.toString() === productId.toString());
  if (exists) {
    return list;
  }

  list.items.push({
    productId,
    vendorId: product.vendorId,
    addedAt: new Date(),
  });

  await list.save();
  recommendationService.clearRecommendationCache();
  return list;
};

/**
 * @desc Remove product from wishlist
 */
const removeFromWishlist = async (customerId, productId) => {
  const list = await getOrCreateWishlist(customerId);
  list.items = list.items.filter(item => item.productId.toString() !== productId.toString());
  await list.save();
  recommendationService.clearRecommendationCache();
  return list;
};

/**
 * @desc Shift product from wishlist to cart atomically inside a transaction
 */
const moveToCart = async (customerId, productId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const list = await Wishlist.findOne({ customerId }).session(session);
    if (!list) throw new ApiError(404, "Wishlist not found");

    const itemExists = list.items.some(item => item.productId.toString() === productId.toString());
    if (!itemExists) throw new ApiError(404, "Item not in wishlist");

    list.items = list.items.filter(item => item.productId.toString() !== productId.toString());
    await list.save({ session });

    await cartService.addToCart(customerId, productId, 1);

    await session.commitTransaction();
    session.endSession();

    recommendationService.clearRecommendationCache();
    return getWishlist(customerId);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * @desc Clear wishlist items
 */
const clearWishlist = async (customerId) => {
  const list = await getOrCreateWishlist(customerId);
  list.items = [];
  await list.save();
  recommendationService.clearRecommendationCache();
  return list;
};

const checkProductUpdates = async (productId, oldPrice, oldStock, newPrice, newStock) => {
  const wishlists = await Wishlist.find({ "items.productId": productId }).lean();
  if (wishlists.length === 0) return;

  const Notification = require("../models/Notification");
  const notifications = [];
  
  for (const wl of wishlists) {
    if (newPrice < oldPrice) {
      notifications.push({
        userId: wl.customerId,
        title: "Price drop in Wishlist!",
        message: `An item in your wishlist has dropped in price from ${oldPrice} to ${newPrice}.`,
        type: "system",
      });
    }

    if (oldStock === 0 && newStock > 0) {
      notifications.push({
        userId: wl.customerId,
        title: "Wishlist item back in stock!",
        message: "An item in your wishlist is now back in stock.",
        type: "system",
      });
    }
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  clearWishlist,
  checkProductUpdates,
};
