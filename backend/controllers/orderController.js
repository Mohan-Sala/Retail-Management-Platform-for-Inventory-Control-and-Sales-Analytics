const orderService = require("../services/orderService");
const ApiResponse = require("../utils/ApiResponse");

const checkout = async (req, res, next) => {
  try {
    const { idempotencyKey, shippingAddress, paymentMethod } = req.body;
    const result = await orderService.checkout(req.user._id, {
      idempotencyKey,
      shippingAddress,
      paymentMethod,
    });
    return res.status(200).json(new ApiResponse(200, result, "Checkout completed successfully"));
  } catch (e) {
    next(e);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrders(req.user._id, req.user.role);
    return res.status(200).json(new ApiResponse(200, orders, "Orders fetched successfully"));
  } catch (e) {
    next(e);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id, req.user._id, req.user.role);
    return res.status(200).json(new ApiResponse(200, order, "Order details fetched successfully"));
  } catch (e) {
    next(e);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const order = await orderService.updateOrderStatus(id, req.user._id, status, notes);
    return res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
  } catch (e) {
    next(e);
  }
};

module.exports = {
  checkout,
  getOrders,
  getOrderById,
  updateOrderStatus,
};
