const returnService = require("../services/returnService");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * @desc Submit a new return/refund request
 */
const createReturnRequest = async (req, res, next) => {
  try {
    const request = await returnService.createReturnRequest(req.user._id, req.body);
    res.status(201).json(new ApiResponse(201, request, "Return request submitted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc List return requests based on user context
 */
const getReturnRequests = async (req, res, next) => {
  try {
    const requests = await returnService.getReturnRequests(req.user._id, req.user.role);
    res.status(200).json(new ApiResponse(200, requests, "Return requests retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Approve a return request, restocking items if requested
 */
const approveReturnRequest = async (req, res, next) => {
  try {
    const request = await returnService.approveReturnRequest(req.params.id, req.user._id, req.user.role);
    res.status(200).json(new ApiResponse(200, request, "Return request approved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Reject a return request
 */
const rejectReturnRequest = async (req, res, next) => {
  try {
    const request = await returnService.rejectReturnRequest(req.params.id, req.user._id, req.user.role);
    res.status(200).json(new ApiResponse(200, request, "Return request rejected successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Mark a return request as completed
 */
const completeReturnRequest = async (req, res, next) => {
  try {
    const request = await returnService.completeReturnRequest(req.params.id);
    res.status(200).json(new ApiResponse(200, request, "Return request completed successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReturnRequest,
  getReturnRequests,
  approveReturnRequest,
  rejectReturnRequest,
  completeReturnRequest,
};
