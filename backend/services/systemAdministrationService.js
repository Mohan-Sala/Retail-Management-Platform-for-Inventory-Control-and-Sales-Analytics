const SystemAudit = require("../models/SystemAudit");
const SystemConfiguration = require("../models/SystemConfiguration");
const BackgroundJobStatus = require("../models/BackgroundJobStatus");
const ApiUsageMetric = require("../models/ApiUsageMetric");
const mongoose = require("mongoose");
const os = require("os");

/**
 * @desc Log audit records asynchronously
 */
const logAudit = async (data) => {
  try {
    setImmediate(async () => {
      try {
        await SystemAudit.create(data);
      } catch (err) {
        console.error("Failed to write audit log:", err.message);
      }
    });
  } catch (e) {
    console.error("Audit logging dispatch error:", e);
  }
};

/**
 * @desc Load singleton configuration settings
 */
const getConfiguration = async () => {
  let config = await SystemConfiguration.findOne({});
  if (!config) {
    config = await SystemConfiguration.create({});
  }
  return config;
};

/**
 * @desc Save new configuration variables settings
 */
const updateConfiguration = async (data) => {
  return SystemConfiguration.findOneAndUpdate({}, data, { new: true, upsert: true });
};

/**
 * @desc Get Unified diagnostic monitoring payload
 */
const getSystemHealthStats = async () => {
  const heap = process.memoryUsage();

  const dbStart = Date.now();
  let dbConnected = false;
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      dbConnected = true;
    }
  } catch (e) {
    console.error("Database health ping failed:", e.message);
  }
  const dbLatency = Date.now() - dbStart;

  const workers = await BackgroundJobStatus.find({}).lean();

  return {
    server: {
      uptime: process.uptime(),
      cpuUsage: os.loadavg()[0],
      freeMem: os.freemem(),
      totalMem: os.totalmem(),
      heapUsed: heap.heapUsed,
      heapTotal: heap.heapTotal,
    },
    database: {
      connected: dbConnected,
      latencyMs: dbLatency,
      connectionState: mongoose.connection.readyState,
    },
    workers: workers.map((w) => ({
      name: w.jobName,
      status: w.status,
      lastRun: w.lastRun,
      failureCount: w.failureCount,
    })),
  };
};

/**
 * @desc Delete audit logs older than settings limits
 */
const runRetentionCleanup = async () => {
  const config = await getConfiguration();
  const now = new Date();

  const auditCutoff = new Date(now.getTime() - config.auditRetentionDays * 24 * 60 * 60 * 1000);
  const auditRes = await SystemAudit.deleteMany({ createdAt: { $lt: auditCutoff } });
  const apiRes = await ApiUsageMetric.deleteMany({ updatedAt: { $lt: auditCutoff } });

  console.log(`[Administration Cleanup] Audit logs purged: ${auditRes.deletedCount}`);
  return {
    auditsCleaned: auditRes.deletedCount,
    apiCleaned: apiRes.deletedCount,
  };
};

/**
 * @desc Update or record background job run parameters
 */
const updateJobStatus = async (jobName, status, durationMs = 0, lastError = null) => {
  try {
    const query = { jobName };
    const update = {
      status,
      lastRun: new Date(),
      heartbeat: new Date(),
      durationMs,
      $inc: {
        successCount: status === "idle" || status === "running" ? 1 : 0,
        failureCount: status === "failed" ? 1 : 0,
      }
    };
    if (lastError) update.lastError = lastError;

    await BackgroundJobStatus.findOneAndUpdate(query, update, { upsert: true, new: true });
  } catch (err) {
    console.error(`Failed to update background job status for ${jobName}:`, err.message);
  }
};

module.exports = {
  logAudit,
  getConfiguration,
  updateConfiguration,
  getSystemHealthStats,
  runRetentionCleanup,
  updateJobStatus,
};
