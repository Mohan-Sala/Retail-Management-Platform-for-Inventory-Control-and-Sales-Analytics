const permissionService = require("../services/permissionService");
const ApiError = require("../utils/ApiError");

/**
 * @desc Checks if the user has custom permissions overrides or has permission globally via their role
 */
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, "Authentication is required to access this resource"));
      }

      // Check custom user permissions override list
      const customOverrides = req.user.preferences?.permissions || [];
      if (customOverrides.includes(requiredPermission) || customOverrides.includes("*")) {
        return next();
      }

      // Check default role-permission mapping
      const allowed = await permissionService.hasPermission(req.user.role, requiredPermission);
      if (allowed) {
        return next();
      }

      next(new ApiError(403, `Access Denied: You do not possess the required permission: ${requiredPermission}`));
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requirePermission,
};
