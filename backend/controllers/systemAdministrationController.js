const systemAdministrationService = require("../services/systemAdministrationService");
const SystemAudit = require("../models/SystemAudit");
const ApiUsageMetric = require("../models/ApiUsageMetric");
const BackgroundJobStatus = require("../models/BackgroundJobStatus");
const User = require("../models/User");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get Unified monitoring diagnostics payload
 */
const getDashboard = async (req, res, next) => {
  try {
    const stats = await systemAdministrationService.getSystemHealthStats();
    res.status(200).json({ success: true, message: "Administration diagnostics compiled", data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Fetch global system singleton configuration settings
 */
const getConfiguration = async (req, res, next) => {
  try {
    const config = await systemAdministrationService.getConfiguration();
    res.status(200).json({ success: true, message: "System settings loaded", data: config });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update global system configuration settings
 */
const updateConfiguration = async (req, res, next) => {
  try {
    const config = await systemAdministrationService.updateConfiguration(req.body);
    res.status(200).json({ success: true, message: "System settings updated successfully", data: config });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get paginated audit logs trail list
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { module, action, userId, page = 1, limit = 10 } = req.query;
    const match = {};
    if (module) match.module = module;
    if (action) match.action = action;
    if (userId) match.userId = userId;

    const list = await SystemAudit.find(match)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await SystemAudit.countDocuments(match);
    res.status(200).json({
      success: true,
      message: "Audit logs fetched",
      data: {
        logs: list,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)) || 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Fetch specific audit log item
 */
const getAuditLogById = async (req, res, next) => {
  try {
    const log = await SystemAudit.findById(req.params.id);
    if (!log) throw new ApiError(404, "Audit record not found");
    res.status(200).json({ success: true, message: "Audit details loaded", data: log });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Fetch API latency usage statistics
 */
const getApiUsageMetrics = async (req, res, next) => {
  try {
    const list = await ApiUsageMetric.find({}).sort({ totalRequests: -1 }).limit(50).lean();
    res.status(200).json({ success: true, message: "API metrics loaded", data: list });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Fetch worker heartbeat run statuses
 */
const getBackgroundJobs = async (req, res, next) => {
  try {
    const list = await BackgroundJobStatus.find({}).lean();
    res.status(200).json({ success: true, message: "Workers statuses loaded", data: list });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Pause background worker
 */
const pauseBackgroundJob = async (req, res, next) => {
  try {
    const job = await BackgroundJobStatus.findOneAndUpdate(
      { jobName: req.params.job },
      { status: "paused" },
      { new: true }
    );
    res.status(200).json({ success: true, message: "Worker paused successfully", data: job });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Resume background worker
 */
const resumeBackgroundJob = async (req, res, next) => {
  try {
    const job = await BackgroundJobStatus.findOneAndUpdate(
      { jobName: req.params.job },
      { status: "idle" },
      { new: true }
    );
    res.status(200).json({ success: true, message: "Worker resumed successfully", data: job });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Manually clear system-wide expired data records
 */
const runCleanup = async (req, res, next) => {
  try {
    const result = await systemAdministrationService.runRetentionCleanup();
    res.status(200).json({ success: true, message: "Data retention cleanups completed", data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Fetch collection statistics counts
 */
const getStatistics = async (req, res, next) => {
  try {
    const [users, products, customers, transactions, audits] = await Promise.all([
      User.countDocuments({}),
      Product.countDocuments({}),
      Customer.countDocuments({}),
      Transaction.countDocuments({}),
      SystemAudit.countDocuments({}),
    ]);
    res.status(200).json({
      success: true,
      message: "System statistics compiled",
      data: { users, products, customers, transactions, audits }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Health pings checker
 */
const getHealthStatus = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: "Server operational", data: { status: "UP", timestamp: new Date() } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getConfiguration,
  updateConfiguration,
  getAuditLogs,
  getAuditLogById,
  getApiUsageMetrics,
  getBackgroundJobs,
  pauseBackgroundJob,
  resumeBackgroundJob,
  runCleanup,
  getStatistics,
  getHealthStatus,
};
