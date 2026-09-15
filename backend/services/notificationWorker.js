const Product = require("../models/Product");
const Report = require("../models/Report");
const ChatHistory = require("../models/ChatHistory");
const Notification = require("../models/Notification");
const ReportLock = require("../models/ReportLock");
const notificationService = require("./notificationService");

/**
 * @desc Run worker tasks guarded by DB-backed distributed locking
 */
const runWithLock = async (lockKey, expiresMs, taskCallback) => {
  const startTime = Date.now();
  const adminService = require("./systemAdministrationService");
  const jobName = lockKey.replace("worker_", "").replace("_scan", "").replace("run_", "");
  await adminService.updateJobStatus(jobName, "running");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresMs);
  let lockAcquired = false;

  try {
    const existingLock = await ReportLock.findOne({ lockKey });
    if (existingLock) {
      if (new Date(existingLock.expiresAt) < now) {
        existingLock.acquiredAt = now;
        existingLock.expiresAt = expiresAt;
        await existingLock.save();
        lockAcquired = true;
      }
    } else {
      await ReportLock.create({ lockKey, expiresAt });
      lockAcquired = true;
    }
  } catch (e) {
    // Unique key collision blocks duplicate worker execution
  }

  if (!lockAcquired) return;

  try {
    await taskCallback();
    await adminService.updateJobStatus(jobName, "idle", Date.now() - startTime);
  } catch (err) {
    console.error(`[Worker Lock: ${lockKey}] Task failed:`, err);
    await adminService.updateJobStatus(jobName, "failed", Date.now() - startTime, err.message);
  } finally {
    try {
      await ReportLock.deleteOne({ lockKey });
    } catch (e) {}
  }
};

/**
 * @desc Scan and flag low stock/out of stock items (Runs every 5 mins)
 */
const scanInventory = async () => {
  await runWithLock("worker_inventory_scan", 4 * 60 * 1000, async () => {
    const products = await Product.find({ isDeleted: false });
    for (let p of products) {
      if (p.stock === 0) {
        await notificationService.createNotification({
          title: `Out Of Stock: ${p.name}`,
          message: `Product ${p.name} (SKU: ${p.sku}) is completely out of stock.`,
          type: "out_of_stock",
          priority: "critical",
          category: "inventory",
          roleVisibility: ["admin", "manager", "vendor"],
          vendorId: p.vendorId,
          metadata: { productId: p._id },
        });
      } else if (p.stock <= (p.lowStockAlertThreshold || 5)) {
        await notificationService.createNotification({
          title: `Low Stock Alert: ${p.name}`,
          message: `Only ${p.stock} units remaining for ${p.name}.`,
          type: "low_stock",
          priority: "high",
          category: "inventory",
          roleVisibility: ["admin", "manager", "vendor"],
          vendorId: p.vendorId,
          metadata: { productId: p._id },
        });
      }
    }
  });
};

/**
 * @desc Scan general forecast indicators (Runs every 30 mins)
 */
const scanForecast = async () => {
  await runWithLock("worker_forecast_scan", 10 * 60 * 1000, async () => {
    try {
      const forecastService = require("./forecastingService");
      const analytics = await forecastService.getForecastData("revenue");
      if (analytics && analytics.predictedDemand > 100) {
        await notificationService.createNotification({
          title: "High Demand Projected",
          message: "A significant increase in customer checkout demand is projected shortly.",
          type: "demand_change",
          priority: "medium",
          category: "forecast",
          roleVisibility: ["admin", "manager"],
        });
      }
    } catch (err) {
      // Forecast data may be empty or unseeded initially
    }
  });
};

/**
 * @desc Scan report job status and alerts (Runs every 5 mins)
 */
const scanReportStatus = async () => {
  await runWithLock("worker_report_scan", 4 * 60 * 1000, async () => {
    const failedJobs = await Report.find({ status: "failed", isDeleted: false });
    for (let r of failedJobs) {
      await notificationService.createNotification({
        title: `Report Failed: ${r.title}`,
        message: `Compilation failed: ${r.errorMessage || "Unknown queue error"}`,
        type: "report_failed",
        priority: "high",
        category: "reports",
        roleVisibility: ["admin", "manager", "vendor", "staff"],
        userId: r.creatorId,
        metadata: { reportId: r._id },
      });
    }

    const readyJobs = await Report.find({ status: "completed", isDeleted: false });
    for (let r of readyJobs) {
      await notificationService.createNotification({
        title: `Report Ready: ${r.title}`,
        message: `Your compiled report is ready for download.`,
        type: "report_ready",
        priority: "low",
        category: "reports",
        roleVisibility: ["admin", "manager", "vendor", "staff"],
        userId: r.creatorId,
        metadata: { reportId: r._id },
      });
    }
  });
};

/**
 * @desc Scan AI Thread query logs for errors (Runs every 15 mins)
 */
const scanAIHealth = async () => {
  await runWithLock("worker_ai_health_scan", 10 * 60 * 1000, async () => {
    const errorCount = await ChatHistory.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
      answer: /error/i,
    });

    if (errorCount > 5) {
      await notificationService.createNotification({
        title: "AI Assistant Warnings",
        message: `Frequent errors (${errorCount}) detected in AI requests within the last 15 minutes.`,
        type: "ai_errors",
        priority: "high",
        category: "ai",
        roleVisibility: ["admin"],
      });
    }
  });
};

/**
 * @desc Hourly notification archives and purges
 */
const runNotificationCleanup = async () => {
  await runWithLock("worker_notification_cleanup", 40 * 60 * 1000, async () => {
    const now = new Date();
    // 1. Purge expired
    await Notification.deleteMany({ expiresAt: { $lt: now } });
    
    // 2. Auto-archive old read alerts
    const archiveLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await Notification.updateMany(
      { isRead: true, isArchived: false, createdAt: { $lt: archiveLimit } },
      { isArchived: true, archivedAt: now }
    );
  });
};

module.exports = {
  scanInventory,
  scanForecast,
  scanReportStatus,
  scanAIHealth,
  runNotificationCleanup,
};
