const crypto = require("crypto");
const Notification = require("../models/Notification");
const Vendor = require("../models/Vendor");

// Registry list storing active SSE client connections
let clients = [];

/**
 * @desc Generate unique SHA-256 fingerprint hash
 */
const getFingerprint = (type, category, vendorId, userId, metadata) => {
  const raw = JSON.stringify({
    type,
    category,
    vendorId: vendorId ? vendorId.toString() : "",
    userId: userId ? userId.toString() : "",
    metadata: metadata || {},
  });
  return crypto.createHash("sha256").update(raw).digest("hex");
};

/**
 * @desc Register active SSE client streaming session
 */
const registerClient = (userId, role, vendorId, res) => {
  const clientObj = { userId: userId?.toString(), role, vendorId: vendorId?.toString(), res };
  clients.push(clientObj);
  return () => {
    clients = clients.filter(c => c.res !== res);
  };
};

/**
 * @desc Push new notifications to active SSE clients matching scoping requirements
 */
const broadcastNotification = (notification) => {
  const userStr = notification.userId ? notification.userId.toString() : null;
  const vendorStr = notification.vendorId ? notification.vendorId.toString() : null;
  const roles = notification.roleVisibility || [];

  clients.forEach(client => {
    let matched = false;

    if (userStr && client.userId === userStr) {
      matched = true;
    } else if (vendorStr && client.vendorId === vendorStr) {
      matched = true;
    } else if (roles.includes(client.role)) {
      matched = true;
    }

    if (matched) {
      try {
        client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
      } catch (e) {
        console.error("[Notification Broker] Failed to write SSE payload:", e);
      }
    }
  });
};

/**
 * @desc Create notification with fingerprint-based cooldown checks
 */
const createNotification = async (data) => {
  const { 
    title, message, type, priority, category, 
    roleVisibility, vendorId, userId, metadata, 
    actionUrl, icon, color, createdBy 
  } = data;

  const fingerprint = getFingerprint(type, category, vendorId, userId, metadata);

  // Check 24-hour cooldown threshold
  const cooldownThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicate = await Notification.findOne({
    notificationFingerprint: fingerprint,
    createdAt: { $gte: cooldownThreshold },
    isDeleted: false,
  });

  if (duplicate) {
    console.log(`[Notification Service] Duplicate alert skipped (cooldown active): ${fingerprint}`);
    return duplicate;
  }

  // Auto expiry lifetimes (critical: 30d, high: 21d, medium: 14d, low: 7d)
  let lifetimeDays = 14;
  if (priority === "critical") lifetimeDays = 30;
  else if (priority === "high") lifetimeDays = 21;
  else if (priority === "low") lifetimeDays = 7;
  const expiresAt = new Date(Date.now() + lifetimeDays * 24 * 60 * 60 * 1000);

  const notification = await Notification.create({
    title,
    message,
    type,
    priority: priority || "low",
    category: category || "system",
    roleVisibility: roleVisibility || [],
    vendorId,
    userId,
    metadata,
    actionUrl,
    icon,
    color,
    notificationFingerprint: fingerprint,
    expiresAt,
    createdBy,
  });

  broadcastNotification(notification);

  return notification;
};

/**
 * @desc Retrieve paginated notifications scoped to user permissions
 */
const getNotifications = async (user, filters = {}) => {
  const { page = 1, limit = 20, category, priority, status } = filters;
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const query = { isDeleted: false };

  if (status === "archived") {
    query.isArchived = true;
  } else {
    query.isArchived = false;
  }

  if (category) query.category = category;
  if (priority) query.priority = priority;

  let vendorIdStr = null;
  if (user.role === "vendor") {
    const v = await Vendor.findOne({ email: user.email });
    if (v) vendorIdStr = v._id;
  }

  if (user.role === "vendor") {
    query.$or = [
      { roleVisibility: "vendor", vendorId: vendorIdStr },
      { userId: user._id }
    ];
  } else {
    query.$or = [
      { roleVisibility: user.role },
      { userId: user._id }
    ];
  }

  const total = await Notification.countDocuments(query);
  const list = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  return {
    notifications: list,
    pagination: {
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
      total,
    }
  };
};

module.exports = {
  createNotification,
  getNotifications,
  registerClient,
  broadcastNotification,
  getFingerprint,
};
