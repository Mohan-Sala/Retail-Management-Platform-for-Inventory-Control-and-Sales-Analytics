require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const app = require("./app");

// 1. Environment Variable Validation
const requiredEnv = ["MONGO_URI", "PORT", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error("\n==================================================");
  console.error("        SERVER STARTUP EXCEPTION: VALIDATION FAILED  ");
  console.error("==================================================");
  console.error(`Missing required environment variable(s): ${missingEnv.join(", ")}`);
  console.error("Please configure them in your backend/.env file.");
  console.error("==================================================\n");
  process.exit(1);
}

const PORT = process.env.PORT;
let server;
const startServer = async () => {
  try {
    await connectDB();
    try {
      const Vendor = require("./models/Vendor");
      await Vendor.updateMany({ status: { $ne: "active" } }, { status: "active" });
      console.log("[Migration] Set all existing vendors as active.");
    } catch (e) {
      console.error("[Migration] Failed to activate existing vendors:", e.message);
    }
    try {
      const Customer = require("./models/Customer");
      const customers = await Customer.find({});
      const cities = ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        if (!customer.city || customer.city === "Default City" || customer.city === "Update City" || customer.city === "Metropolis" || customer.city === "NYC") {
          customer.city = cities[i % cities.length];
          await customer.save();
        }
      }
      console.log("[Migration] Distributed customer cities successfully.");
    } catch (e) {
      console.error("[Migration] Failed to distribute customer cities:", e.message);
    }
    try {
      await require("./services/aiService").initSettings();
    } catch (e) {
      console.error("Failed to seed default AI settings on startup:", e);
    }
    const runSweep = async () => {
      const startTime = Date.now();
      const adminService = require("./services/systemAdministrationService");
      await adminService.updateJobStatus("AI assistant & reports cleanup", "running");
      const now = new Date();
      const ReportLock = require("./models/ReportLock");
      const lockKey = "reports_background_worker_lock";
      const lockExpiry = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes lock

      let lockAcquired = false;
      try {
        const existingLock = await ReportLock.findOne({ lockKey });
        if (existingLock) {
          if (new Date(existingLock.expiresAt) < now) {
            existingLock.acquiredAt = now;
            existingLock.expiresAt = lockExpiry;
            await existingLock.save();
            lockAcquired = true;
          }
        } else {
          await ReportLock.create({ lockKey, expiresAt: lockExpiry });
          lockAcquired = true;
        }
      } catch (e) {
        // Lock acquisition failed (held by another instance)
      }

      if (!lockAcquired) return;

      try {
        const AISettings = require("./models/AISettings");
        const Conversation = require("./models/Conversation");
        const AIRateLimit = require("./models/AIRateLimit");
        const Report = require("./models/Report");
        const ReportShare = require("./models/ReportShare");
        const ReportSchedule = require("./models/ReportSchedule");
        const ReportStorageService = require("./services/ReportStorageService");
        const reportQueue = require("./services/reportQueue");
        
        const settings = await AISettings.findOne() || new AISettings();
        const retentionThreshold = new Date(now.getTime() - settings.retentionDays * 24 * 60 * 60 * 1000);
        
        // 1. Purge soft-deleted conversations
        await Conversation.deleteMany({ isDeleted: true, deletedAt: { $lt: retentionThreshold } });
        
        // 2. Clean rate limits
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        await AIRateLimit.updateMany({}, { $pull: { timestamps: { $lt: oneHourAgo } } });
        await AIRateLimit.deleteMany({ timestamps: { $size: 0 } });

        // 3. Purge expired report files from disk
        const expiredReports = await Report.find({ expiresAt: { $lt: now }, isDeleted: false });
        for (let r of expiredReports) {
          await ReportStorageService.deleteFile(r.fileUrl);
          r.isDeleted = true;
          r.deletedAt = now;
          await r.save();
        }

        // 4. Revoke expired share links
        await ReportShare.updateMany(
          { expiryDate: { $lt: now }, isRevoked: false },
          { isRevoked: true }
        );

        // 5. Trigger scheduled report jobs
        const schedules = await ReportSchedule.find({ isActive: true, nextRunAt: { $lte: now } });
        for (let s of schedules) {
          try {
            await reportQueue.addJobToQueue({
              title: `${s.title} (Scheduled)`,
              type: s.type,
              format: s.format,
              filters: s.filters,
              creatorId: s.creatorId,
              version: 1,
            });

            s.lastRunAt = now;
            s.consecutiveFailureCount = 0;

            let offset = 24 * 60 * 60 * 1000;
            if (s.frequency === "weekly") offset *= 7;
            else if (s.frequency === "monthly") offset *= 30;
            else if (s.frequency === "quarterly") offset *= 90;
            else if (s.frequency === "yearly") offset *= 365;

            s.nextRunAt = new Date(now.getTime() + offset);
            await s.save();
          } catch (err) {
            s.consecutiveFailureCount += 1;
            s.lastError = err.message;
            await s.save();
          }
        }
        
        console.log("[Background Sweep] AI Assistant & Reports cleanup worker successfully completed sweep.");
        await adminService.updateJobStatus("AI assistant & reports cleanup", "idle", Date.now() - startTime);
      } catch (err) {
        console.error("AI Assistant background sweep worker failed:", err);
        await adminService.updateJobStatus("AI assistant & reports cleanup", "failed", Date.now() - startTime, err.message);
      } finally {
        // Release lock
        try {
          await ReportLock.deleteOne({ lockKey });
        } catch (e) {}
      }
    };
    setInterval(runSweep, 60 * 60 * 1000);
    runSweep();

    // Register independent Notification background scan workers
    const notificationWorker = require("./services/notificationWorker");
    
    // Inventory Scan: every 5 minutes
    setInterval(notificationWorker.scanInventory, 5 * 60 * 1000);
    notificationWorker.scanInventory();
    
    // Forecast Scan: every 30 minutes
    setInterval(notificationWorker.scanForecast, 30 * 60 * 1000);
    notificationWorker.scanForecast();
    
    // Report Status Scan: every 5 minutes
    setInterval(notificationWorker.scanReportStatus, 5 * 60 * 1000);
    notificationWorker.scanReportStatus();
    
    // AI Health Scan: every 15 minutes
    setInterval(notificationWorker.scanAIHealth, 15 * 60 * 1000);
    notificationWorker.scanAIHealth();
    
    // Cleanup Worker: hourly
    setInterval(notificationWorker.runNotificationCleanup, 60 * 60 * 1000);
    notificationWorker.runNotificationCleanup();

    server = app.listen(PORT, () => {
      console.log(`[ShopSense Server] Running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`[ShopSense Server] Swagger Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Database connection failed. Exiting server...", error);
    process.exit(1);
  }
};

// 2. Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  console.log(`\n[ShopSense Server] Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log("[ShopSense Server] Express HTTP server closed.");
      try {
        await mongoose.disconnect();
        console.log("[ShopSense Server] MongoDB connection closed.");
        console.log("[ShopSense Server] Shutdown completed safely.");
        process.exit(0);
      } catch (err) {
        console.error("[ShopSense Server] Error during database disconnection:", err.message);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }

  // Force close after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error("[ShopSense Server] Forcefully shutting down after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

startServer();