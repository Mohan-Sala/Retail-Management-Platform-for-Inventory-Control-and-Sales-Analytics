const authService = require("../services/authService");
const ApiResponse = require("../utils/ApiResponse");

/**
 * @desc Register user
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const data = await authService.registerUser(req.body);
    res.status(201).json(new ApiResponse(201, data, "User registered successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Login user
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.loginUser(email, password);
    res.status(200).json(new ApiResponse(200, data, "Login successful"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get logged-in user profile
 * @route GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user._id);
    res.status(200).json(new ApiResponse(200, profile, "Profile retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
