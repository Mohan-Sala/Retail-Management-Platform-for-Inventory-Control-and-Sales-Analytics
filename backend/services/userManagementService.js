const User = require("../models/User");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get soft-deleted filtered users lists
 */
const getUsers = async (query = {}) => {
  const { role, status, department, search, page = 1, limit = 10 } = query;
  const match = { deletedAt: null };

  if (role) match.role = role;
  if (status) match.status = status;
  if (department) match.department = department;

  if (search) {
    match.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const list = await User.find(match)
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .select("-password")
    .lean();

  const total = await User.countDocuments(match);
  return {
    users: list,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)) || 1,
    },
  };
};

/**
 * @desc Creates new user record, performing duplicates checks
 */
const createUser = async (currentUser, data) => {
  const { email } = data;

  const existingEmail = await User.findOne({ email, deletedAt: null });
  if (existingEmail) throw new ApiError(400, "Email address is already registered");

  const user = new User({
    ...data,
    createdBy: currentUser.name,
  });
  await user.save();
  return user;
};

/**
 * @desc Updates user preferences, guarding against self downgrades
 */
const updateUser = async (currentUser, id, data) => {
  if (currentUser._id.toString() === id) {
    if (data.role && data.role !== currentUser.role) {
      throw new ApiError(400, "Admins cannot modify or downgrade their own roles");
    }
    if (data.status && data.status !== "active") {
      throw new ApiError(400, "Admins cannot lock or deactivate their own accounts");
    }
  }

  const user = await User.findById(id);
  if (!user || user.deletedAt) throw new ApiError(404, "User not found");

  Object.assign(user, data);
  user.updatedBy = currentUser.name;
  await user.save();
  return user;
};

/**
 * @desc Soft-deletes user checks ensuring last admin remains intact
 */
const softDeleteUser = async (currentUser, id) => {
  if (currentUser._id.toString() === id) {
    throw new ApiError(400, "You cannot delete or deactivate your own admin profile");
  }

  const userToDelete = await User.findById(id);
  if (userToDelete && userToDelete.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin", deletedAt: null });
    if (adminCount <= 1) {
      throw new ApiError(400, "Critical Safeguard: Cannot delete the last remaining admin user");
    }
  }

  return User.findByIdAndUpdate(id, { deletedAt: new Date() }, { returnDocument: "after" });
};

/**
 * @desc Restores soft-deleted user profile
 */
const restoreUser = async (id) => {
  return User.findByIdAndUpdate(id, { deletedAt: null }, { returnDocument: "after" });
};

/**
 * @desc Set custom permissions checks updates
 */
const changeUserPermissions = async (currentUser, id, permissions) => {
  if (currentUser._id.toString() === id) {
    throw new ApiError(400, "Admins cannot modify their own system access permissions");
  }
  return User.findByIdAndUpdate(id, { "preferences.permissions": permissions }, { returnDocument: "after" });
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  softDeleteUser,
  restoreUser,
  changeUserPermissions,
};
