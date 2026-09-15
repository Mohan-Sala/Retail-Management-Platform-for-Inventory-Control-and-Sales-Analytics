const wishlistService = require("../services/wishlistService");
const ApiResponse = require("../utils/ApiResponse");

const getWishlist = async (req, res, next) => {
  try {
    const list = await wishlistService.getWishlist(req.user._id);
    return res.status(200).json(new ApiResponse(200, list, "Wishlist fetched successfully"));
  } catch (e) {
    next(e);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const list = await wishlistService.addToWishlist(req.user._id, productId);
    return res.status(200).json(new ApiResponse(200, list, "Product added to wishlist successfully"));
  } catch (e) {
    next(e);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const list = await wishlistService.removeFromWishlist(req.user._id, productId);
    return res.status(200).json(new ApiResponse(200, list, "Product removed from wishlist successfully"));
  } catch (e) {
    next(e);
  }
};

const moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const list = await wishlistService.moveToCart(req.user._id, productId);
    return res.status(200).json(new ApiResponse(200, list, "Product moved to shopping cart successfully"));
  } catch (e) {
    next(e);
  }
};

const clearWishlist = async (req, res, next) => {
  try {
    const list = await wishlistService.clearWishlist(req.user._id);
    return res.status(200).json(new ApiResponse(200, list, "Wishlist cleared successfully"));
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  clearWishlist,
};
