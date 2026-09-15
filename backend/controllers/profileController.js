const profileService = require("../services/profileService");
const User = require("../models/User");

/**
 * @desc Get self-profile details
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password").lean();
    res.status(200).json({ success: true, message: "Profile details loaded", data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Updates general personal profile details
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await profileService.updateProfile(req.user._id, req.body);
    res.status(200).json({ success: true, message: "Profile updated successfully", data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Updates password after checking complexity policies
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await profileService.changePassword(req.user._id, currentPassword, newPassword);
    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Handles self profile avatar uploads
 */
const uploadAvatar = async (req, res, next) => {
  try {
    const user = await profileService.handleAvatarUpload(req.user._id, req.body.avatar);
    res.status(200).json({ success: true, message: "Avatar uploaded successfully", data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  uploadAvatar,
};
