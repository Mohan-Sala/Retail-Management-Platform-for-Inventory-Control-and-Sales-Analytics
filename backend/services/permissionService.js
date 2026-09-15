const RolePermission = require("../models/RolePermission");

// Global memory cache storing role permissions list
const permissionCache = new Map();

/**
 * @desc Invalidate cached permissions mappings
 */
const invalidatePermissionCache = () => {
  permissionCache.clear();
  console.log("[Permission Cache] Permission mappings cache successfully invalidated.");
};

/**
 * @desc Seed initial system permissions if missing
 */
const initDefaultPermissions = async () => {
  const defaults = [
    {
      role: "admin",
      permissions: ["*"],
      description: "Full system administrative permissions",
      isSystemRole: true,
      isEditable: false,
    },
    {
      role: "manager",
      permissions: ["products.*", "vendors.read", "customers.*", "transactions.read", "reports.read", "reports.generate", "analytics.read", "businessInsights.read"],
      description: "Manage catalog, customers, and view reports",
      isSystemRole: true,
      isEditable: true,
    },
    {
      role: "staff",
      permissions: ["products.read", "vendors.read", "customers.read", "transactions.read", "inventory.read"],
      description: "Standard operational views read-only access",
      isSystemRole: true,
      isEditable: true,
    },
    {
      role: "vendor",
      permissions: ["products.read", "products.write", "inventory.*", "reports.read", "transactions.read"],
      description: "Vendor scoped product management details",
      isSystemRole: true,
      isEditable: true,
    },
  ];

  for (const item of defaults) {
    await RolePermission.findOneAndUpdate({ role: item.role }, item, { upsert: true, returnDocument: "after" });
  }
};

/**
 * @desc Evaluates if a role possesses a capability, supporting prefix wildcards like "products.*"
 */
const hasPermission = async (role, requiredPermission) => {
  if (!permissionCache.has(role)) {
    const doc = await RolePermission.findOne({ role }).lean();
    permissionCache.set(role, doc?.permissions || []);
  }

  const permissions = permissionCache.get(role);

  if (permissions.includes("*") || permissions.includes(requiredPermission)) {
    return true;
  }

  const parts = requiredPermission.split(".");
  if (parts.length > 1) {
    const wildcardPrefix = `${parts[0]}.*`;
    if (permissions.includes(wildcardPrefix)) {
      return true;
    }
  }

  return false;
};

module.exports = {
  initDefaultPermissions,
  hasPermission,
  invalidatePermissionCache,
};
