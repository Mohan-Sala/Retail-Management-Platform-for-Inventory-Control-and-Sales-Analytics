const userManagementService = require("../services/userManagementService");
const sessionService = require("../services/sessionService");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get users listing with query parameters
 */
const getUsers = async (req, res, next) => {
  try {
    const data = await userManagementService.getUsers(req.query);
    res.status(200).json({ success: true, message: "Users list loaded", data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Fetch specific user details
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user || user.deletedAt) throw new ApiError(404, "User not found");
    res.status(200).json({ success: true, message: "User details loaded", data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Creates a new user record
 */
const createUser = async (req, res, next) => {
  try {
    const user = await userManagementService.createUser(req.user, req.body);
    res.status(201).json({ success: true, message: "User created successfully", data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc General updates parameters modification
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await userManagementService.updateUser(req.user, req.params.id, req.body);
    res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Soft-deletes user profile
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await userManagementService.softDeleteUser(req.user, req.params.id);
    res.status(200).json({ success: true, message: "User soft-deleted successfully", data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Restores soft-deleted user profile
 */
const restoreUser = async (req, res, next) => {
  try {
    const user = await userManagementService.restoreUser(req.params.id);
    res.status(200).json({ success: true, message: "User restored successfully", data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Updates status (active/locked) fields
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const user = await userManagementService.updateUser(req.user, req.params.id, { status: req.body.status });
    res.status(200).json({ success: true, message: "User status updated successfully", data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Resets user password (restricted administrative override)
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.deletedAt) throw new ApiError(404, "User not found");
    user.password = req.body.password;
    await user.save();
    res.status(200).json({ success: true, message: "User password reset successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Updates role assignment
 */
const updateUserRole = async (req, res, next) => {
  try {
    const user = await userManagementService.updateUser(req.user, req.params.id, { role: req.body.role });
    res.status(200).json({ success: true, message: "User role updated successfully", data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Assign overrides access permissions list
 */
const updateUserPermissions = async (req, res, next) => {
  try {
    const user = await userManagementService.changeUserPermissions(req.user, req.params.id, req.body.permissions);
    res.status(200).json({ success: true, message: "User permissions updated successfully", data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Lists active sessions
 */
const getUserSessions = async (req, res, next) => {
  try {
    const data = await sessionService.getActiveSessions(req.user._id);
    res.status(200).json({ success: true, message: "Active sessions loaded", data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Terminates active login session
 */
const revokeUserSession = async (req, res, next) => {
  try {
    const data = await sessionService.revokeSession(req.params.sessionId);
    res.status(200).json({ success: true, message: "Session terminated successfully", data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Revoke all active sessions except current
 */
const revokeAllUserSessions = async (req, res, next) => {
  try {
    await sessionService.revokeAllExcept(req.user._id, req.query.currentSessionId || "");
    res.status(200).json({ success: true, message: "Other sessions terminated successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Returns activity events list
 */
const getUserActivities = async (req, res, next) => {
  try {
    const list = [
      { action: "login", timestamp: new Date(), ipAddress: "127.0.0.1", status: "success" },
      { action: "settings_update", timestamp: new Date(), ipAddress: "127.0.0.1", status: "success" },
    ];
    res.status(200).json({ success: true, message: "Activities loaded", data: list });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
  updateUserStatus,
  resetUserPassword,
  updateUserRole,
  updateUserPermissions,
  getUserSessions,
  revokeUserSession,
  revokeAllUserSessions,
  getUserActivities,
};
