const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const ApiError = require("../utils/ApiError");

const getOrCreateCart = async (customerId) => {
  let cart = await Cart.findOne({ customerId });
  if (!cart) {
    cart = await Cart.create({ customerId, items: [] });
  }
  return cart;
};

/**
 * @desc Retrieve cart details with real-time stock and price validations
 */
const getCart = async (customerId) => {
  const cart = await getOrCreateCart(customerId);
  let hasChanges = false;
  const validatedItems = [];

  for (const item of cart.items) {
    const product = await Product.findOne({ _id: item.productId, deletedAt: null });
    if (!product || product.status !== "active") {
      hasChanges = true;
      continue;
    }

    const vendor = await Vendor.findOne({ _id: product.vendorId, deletedAt: null });
    if (!vendor) {
      hasChanges = true;
      continue;
    }

    if (product.stock <= 0) {
      hasChanges = true;
      continue;
    }

    let qty = item.quantity;
    if (qty > product.stock) {
      qty = product.stock;
      hasChanges = true;
    }

    const price = product.price;
    const subtotal = qty * price;

    validatedItems.push({
      productId: item.productId,
      vendorId: product.vendorId,
      quantity: qty,
      priceAtAddition: price,
      subtotal,
    });
  }

  if (hasChanges) {
    cart.items = validatedItems;
    await cart.save();
  }

  await cart.populate("items.productId");
  return cart;
};

/**
 * @desc Add item to cart with stock validation
 */
const addToCart = async (customerId, productId, quantity) => {
  const product = await Product.findOne({ _id: productId, deletedAt: null });
  if (!product || product.status !== "active") {
    throw new ApiError(400, "Product is not available or inactive");
  }

  const vendor = await Vendor.findOne({ _id: product.vendorId, deletedAt: null });
  if (!vendor) {
    throw new ApiError(400, "Vendor shop is currently inactive");
  }

  if (product.stock <= 0) {
    throw new ApiError(400, "Product is out of stock");
  }

  const cart = await getOrCreateCart(customerId);
  const existingIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString());

  let targetQty = quantity;
  if (existingIndex > -1) {
    targetQty += cart.items[existingIndex].quantity;
  }

  if (targetQty > product.stock) {
    throw new ApiError(400, `Cannot exceed available stock of ${product.stock}`);
  }

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity = targetQty;
    cart.items[existingIndex].priceAtAddition = product.price;
    cart.items[existingIndex].subtotal = targetQty * product.price;
  } else {
    cart.items.push({
      productId,
      vendorId: product.vendorId,
      quantity,
      priceAtAddition: product.price,
      subtotal: quantity * product.price,
    });
  }

  await cart.save();
  await cart.populate("items.productId");
  return cart;
};

/**
 * @desc Adjust cart quantity with stock limits check
 */
const updateCartQuantity = async (customerId, productId, quantity) => {
  if (quantity < 1) {
    return removeFromCart(customerId, productId);
  }

  const product = await Product.findOne({ _id: productId, deletedAt: null });
  if (!product || product.status !== "active") {
    throw new ApiError(400, "Product is not available or inactive");
  }

  if (quantity > product.stock) {
    throw new ApiError(400, `Cannot exceed available stock of ${product.stock}`);
  }

  const cart = await getOrCreateCart(customerId);
  const existingIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString());
  if (existingIndex === -1) {
    throw new ApiError(404, "Product not in cart");
  }

  cart.items[existingIndex].quantity = quantity;
  cart.items[existingIndex].priceAtAddition = product.price;
  cart.items[existingIndex].subtotal = quantity * product.price;

  await cart.save();
  await cart.populate("items.productId");
  return cart;
};

/**
 * @desc Remove item from cart
 */
const removeFromCart = async (customerId, productId) => {
  const cart = await getOrCreateCart(customerId);
  cart.items = cart.items.filter(item => item.productId.toString() !== productId.toString());
  await cart.save();
  await cart.populate("items.productId");
  return cart;
};

/**
 * @desc Clear shopping cart
 */
const clearCart = async (customerId) => {
  const cart = await getOrCreateCart(customerId);
  cart.items = [];
  await cart.save();
  await cart.populate("items.productId");
  return cart;
};

module.exports = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
};
