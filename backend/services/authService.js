const User = require("../models/User");
const Vendor = require("../models/Vendor");
const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");

/**
 * @desc Generate JWT Token for user
 * @param {string} id
 * @returns {string}
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * @desc Register a new user
 */
const registerUser = async (userData) => {
  const { name, email, password, role, businessName, phone } = userData;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, "User with this email already exists");
  }

  // Create default avatar URL
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    businessName: role === "vendor" ? businessName : undefined,
    phone: (role === "vendor" || role === "customer" || role === "admin") ? phone : undefined,
    customerProfile: (role === "customer" || role === "admin") ? {} : undefined,
    avatar,
  });

  // If user is a vendor, automatically create a corresponding Vendor record
  if (role === "vendor") {
    // Generate a temporary GST number
    const tempGst = `GST-TEMP-${Math.floor(100000 + Math.random() * 900000)}`;
    
    await Vendor.create({
      businessName: businessName || `${name.split(" ")[0]} Traders`,
      ownerName: name,
      email,
      phone: phone || "+91 9999999999",
      gst: tempGst,
      address: "Update Address",
      city: "Update City",
      status: "active",
      commission: 10,
      avatar,
    });
  }

  const token = generateToken(user._id);

  // Return serialized user data without password
  const userResponse = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    ...(user.role === "vendor" && {
      businessName: user.businessName,
    }),
  };

  return { user: userResponse, token };
};

/**
 * @desc Login user
 */
const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user._id);

  // Format user profile response
  const userResponse = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    ...(user.role === "vendor" && {
      businessName: user.businessName,
      phone: user.phone,
    }),
  };

  return { user: userResponse, token };
};

/**
 * @desc Get User Profile
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    ...(user.role === "vendor" && {
      businessName: user.businessName,
    }),
  };
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
