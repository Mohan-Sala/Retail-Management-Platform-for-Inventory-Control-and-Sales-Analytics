const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

/**
 * @desc Updates general personal fields
 */
const updateProfile = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User profile not found");

  const allowedUpdates = ["name", "phone", "department", "designation", "timezone", "language", "theme"];
  for (const key of allowedUpdates) {
    if (data[key] !== undefined) {
      user[key] = data[key];
    }
  }

  await user.save();
  return user;
};

/**
 * @desc Changes user password after checking complexity policies and history
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User profile not found");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(400, "Current password entered is incorrect");

  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    throw new ApiError(400, "New password cannot match your current active password");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  if (!hasUppercase || !hasNumber) {
    throw new ApiError(400, "Password must contain at least one uppercase letter and one number");
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();
  return user;
};

/**
 * @desc Replaces avatar details and purges older file
 */
const handleAvatarUpload = async (userId, avatarData) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User profile not found");

  if (!avatarData) throw new ApiError(400, "Please provide a valid avatar URL or base64 data");

  if (avatarData.startsWith("data:image/")) {
    const matches = avatarData.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new ApiError(400, "Invalid base64 image data");
    }
    const type = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    if (buffer.length > 2 * 1024 * 1024) {
      throw new ApiError(400, "Avatar file size must be less than 2 MB");
    }

    const filename = `avatar_${userId}_${Date.now()}.${type}`;
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    if (user.avatar && user.avatar.startsWith("/uploads/")) {
      const oldPath = path.join(__dirname, "../..", user.avatar);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error("Purging old avatar failed:", e.message);
        }
      }
    }
    user.avatar = `/uploads/${filename}`;
  } else {
    user.avatar = avatarData;
  }

  await user.save();
  return user;
};

module.exports = {
  updateProfile,
  changePassword,
  handleAvatarUpload,
};
