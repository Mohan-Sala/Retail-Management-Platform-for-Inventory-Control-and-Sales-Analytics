const cartService = require("../services/cartService");
const ApiResponse = require("../utils/ApiResponse");

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user._id);
    return res.status(200).json(new ApiResponse(200, cart, "Cart fetched successfully"));
  } catch (e) {
    next(e);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.addToCart(req.user._id, productId, Number(quantity || 1));
    return res.status(200).json(new ApiResponse(200, cart, "Product added to cart"));
  } catch (e) {
    next(e);
  }
};

const updateCartQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await cartService.updateCartQuantity(req.user._id, productId, Number(quantity));
    return res.status(200).json(new ApiResponse(200, cart, "Cart item updated"));
  } catch (e) {
    next(e);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await cartService.removeFromCart(req.user._id, productId);
    return res.status(200).json(new ApiResponse(200, cart, "Product removed from cart"));
  } catch (e) {
    next(e);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user._id);
    return res.status(200).json(new ApiResponse(200, cart, "Cart cleared successfully"));
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
};
