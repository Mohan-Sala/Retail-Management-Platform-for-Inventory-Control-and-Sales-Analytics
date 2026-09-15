const Notification = require("../models/Notification");
const NotificationPreference = require("../models/NotificationPreference");
const Vendor = require("../models/Vendor");
const notificationService = require("../services/notificationService");
const ApiError = require("../utils/ApiError");

/**
 * @desc Establish active SSE notifications push connection stream
 * @route GET /api/notifications/stream
 */
const streamNotifications = async (req, res, next) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let vendorId = null;
    if (req.user.role === "vendor") {
      const v = await Vendor.findOne({ email: req.user.email });
      if (v) vendorId = v._id;
    }

    const keepAliveInterval = setInterval(() => {
      res.write(":\n\n");
    }, 20000);

    res.write(`data: ${JSON.stringify({ status: "connected" })}\n\n`);

    const unsubscribe = notificationService.registerClient(
      req.user._id,
      req.user.role,
      vendorId,
      res
    );

    req.on("close", () => {
      clearInterval(keepAliveInterval);
      unsubscribe();
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Fetch scoped, paginated notifications matching criteria
 * @route GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      priority: req.query.priority,
      status: req.query.status,
    };

    const data = await notificationService.getNotifications(req.user, filters);

    res.status(200).json({
      success: true,
      message: "Notifications list compiled",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get total number of unread alerts
 * @route GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const query = { isDeleted: false, isRead: false, isArchived: false };

    let vendorIdStr = null;
    if (req.user.role === "vendor") {
      const v = await Vendor.findOne({ email: req.user.email });
      if (v) vendorIdStr = v._id;
    }

    if (req.user.role === "vendor") {
      query.$or = [
        { roleVisibility: "vendor", vendorId: vendorIdStr },
        { userId: req.user._id }
      ];
    } else {
      query.$or = [
        { roleVisibility: req.user.role },
        { userId: req.user._id }
      ];
    }

    const count = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Unread count compiled",
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Mark single notification read
 * @route PUT /api/notifications/:id/read
 */
const markRead = async (req, res, next) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, isDeleted: false });
    if (!n) throw new ApiError(404, "Notification not found");

    n.isRead = true;
    n.readAt = new Date();
    await n.save();

    res.status(200).json({
      success: true,
      message: "Notification marked read",
      data: n,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Mark all scoped notifications read
 * @route PUT /api/notifications/read-all
 */
const markAllRead = async (req, res, next) => {
  try {
    const query = { isDeleted: false, isRead: false };

    let vendorIdStr = null;
    if (req.user.role === "vendor") {
      const v = await Vendor.findOne({ email: req.user.email });
      if (v) vendorIdStr = v._id;
    }

    if (req.user.role === "vendor") {
      query.$or = [
        { roleVisibility: "vendor", vendorId: vendorIdStr },
        { userId: req.user._id }
      ];
    } else {
      query.$or = [
        { roleVisibility: req.user.role },
        { userId: req.user._id }
      ];
    }

    await Notification.updateMany(query, { isRead: true, readAt: new Date() });

    res.status(200).json({
      success: true,
      message: "All alerts marked read",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Toggle notification archive state
 * @route PUT /api/notifications/:id/archive
 */
const archiveNotification = async (req, res, next) => {
  try {
    const { isArchived } = req.body;
    const n = await Notification.findOne({ _id: req.params.id, isDeleted: false });
    if (!n) throw new ApiError(404, "Notification not found");

    n.isArchived = isArchived !== undefined ? !!isArchived : true;
    n.archivedAt = n.isArchived ? new Date() : null;
    await n.save();

    res.status(200).json({
      success: true,
      message: n.isArchived ? "Notification archived" : "Notification unarchived",
      data: n,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Soft delete notification
 * @route DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!n) throw new ApiError(404, "Notification not found");

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Restore soft deleted notification
 * @route PUT /api/notifications/:id/restore
 */
const restoreNotification = async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );

    if (!n) throw new ApiError(404, "Deleted notification not found");

    res.status(200).json({
      success: true,
      message: "Notification restored successfully",
      data: n,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Fetch alert preference toggles
 * @route GET /api/notifications/preferences
 */
const getPreferences = async (req, res, next) => {
  try {
    let pref = await NotificationPreference.findOne({ userId: req.user._id });
    if (!pref) {
      pref = await NotificationPreference.create({ userId: req.user._id });
    }

    res.status(200).json({
      success: true,
      message: "Notification preferences retrieved",
      data: pref,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update alert preference options
 * @route PUT /api/notifications/preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { emailEnabled, inAppEnabled, pushEnabled, categories, quietHours } = req.body;

    const pref = await NotificationPreference.findOneAndUpdate(
      { userId: req.user._id },
      { emailEnabled, inAppEnabled, pushEnabled, categories, quietHours },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Notification preferences updated",
      data: pref,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Compile notifications aggregate analytics
 * @route GET /api/notifications/analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const query = { isDeleted: false };

    let vendorIdStr = null;
    if (req.user.role === "vendor") {
      const v = await Vendor.findOne({ email: req.user.email });
      if (v) vendorIdStr = v._id;
    }

    if (req.user.role === "vendor") {
      query.$or = [
        { roleVisibility: "vendor", vendorId: vendorIdStr },
        { userId: req.user._id }
      ];
    } else {
      query.$or = [
        { roleVisibility: req.user.role },
        { userId: req.user._id }
      ];
    }

    const total = await Notification.countDocuments(query);
    const unread = await Notification.countDocuments({ ...query, isRead: false });
    const read = await Notification.countDocuments({ ...query, isRead: true });
    const archived = await Notification.countDocuments({ ...query, isArchived: true });

    // Category distribution
    const categoryCounts = await Notification.aggregate([
      { $match: query },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    // Priority distribution
    const priorityCounts = await Notification.aggregate([
      { $match: query },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    // Average time to read
    const readTimeStats = await Notification.aggregate([
      { $match: { ...query, isRead: true } },
      {
        $group: {
          _id: null,
          avgTimeMs: { $avg: { $subtract: ["$readAt", "$createdAt"] } }
        }
      }
    ]);

    const readRate = total > 0 ? parseFloat(((read / total) * 100).toFixed(1)) : 100;
    const avgTimeToReadMs = readTimeStats[0]?.avgTimeMs ? Math.round(readTimeStats[0].avgTimeMs) : 0;

    let adminVendorStats = [];
    let adminUserStats = [];
    if (req.user.role === "admin") {
      adminVendorStats = await Notification.aggregate([
        { $match: { isDeleted: false, vendorId: { $ne: null } } },
        { $group: { _id: "$vendorId", count: { $sum: 1 } } }
      ]);

      adminUserStats = await Notification.aggregate([
        { $match: { isDeleted: false, userId: { $ne: null } } },
        { $group: { _id: "$userId", count: { $sum: 1 } } }
      ]);
    }

    res.status(200).json({
      success: true,
      message: "Notification analytics compiled",
      data: {
        totalNotifications: total,
        unread,
        read,
        archived,
        readRate,
        averageTimeToReadMs: avgTimeToReadMs,
        byCategory: categoryCounts.map(c => ({ category: c._id, count: c.count })),
        byPriority: priorityCounts.map(p => ({ priority: p._id, count: p.count })),
        vendorCounts: adminVendorStats,
        userCounts: adminUserStats,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Enqueue test notification for the requester
 * @route POST /api/notifications/test
 */
const sendTestNotification = async (req, res, next) => {
  try {
    const { category = "system", priority = "low" } = req.body;

    const n = await notificationService.createNotification({
      title: "Test Smart Notification",
      message: `Verify system notification channels with priority ${priority} inside ${category}`,
      type: "manual",
      category,
      priority,
      roleVisibility: [req.user.role],
      userId: req.user._id,
      metadata: { test: true },
    });

    res.status(201).json({
      success: true,
      message: "Test notification dispatched successfully",
      data: n,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  streamNotifications,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  archiveNotification,
  deleteNotification,
  restoreNotification,
  getPreferences,
  updatePreferences,
  getAnalytics,
  sendTestNotification,
};
