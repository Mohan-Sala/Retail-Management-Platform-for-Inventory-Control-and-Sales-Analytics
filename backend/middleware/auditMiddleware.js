const systemAdministrationService = require("../services/systemAdministrationService");
const ApiUsageMetric = require("../models/ApiUsageMetric");
const crypto = require("crypto");

/**
 * @desc Mask sensitive fields in payloads (passwords, tokens, keys)
 */
const maskPayload = (body) => {
  if (!body) return body;
  const masked = { ...body };
  const sensitiveKeys = ["password", "token", "jwt", "secret", "apiKey", "passwordConfirm"];

  for (const key of sensitiveKeys) {
    if (masked[key]) {
      masked[key] = "********";
    }
  }
  return masked;
};

/**
 * @desc Automatically log API usage, latencies, and audits
 */
const auditLogger = async (req, res, next) => {
  const start = Date.now();
  const requestId = crypto.randomBytes(8).toString("hex");
  req.requestId = requestId;

  res.on("finish", async () => {
    const latency = Date.now() - start;
    const ip = req.ip || req.connection.remoteAddress;
    const path = req.baseUrl + req.path;

    // Log Api usage metrics
    try {
      await ApiUsageMetric.findOneAndUpdate(
        { endpoint: path, method: req.method },
        {
          $inc: {
            totalRequests: 1,
            successRequests: res.statusCode < 400 ? 1 : 0,
            failedRequests: res.statusCode >= 400 ? 1 : 0,
          },
          $set: {
            lastAccessed: new Date(),
          },
          $max: {
            maxLatency: latency,
          },
        },
        { upsert: true }
      );
    } catch (e) {
      console.error("Metric log error:", e.message);
    }

    // Write audit trail for mutative actions
    const mutativeMethods = ["POST", "PUT", "DELETE", "PATCH"];
    if (mutativeMethods.includes(req.method) && req.user) {
      await systemAdministrationService.logAudit({
        userId: req.user._id,
        userRole: req.user.role,
        action: `${req.method}_${path}`,
        module: path.split("/")[2] || "SYSTEM",
        resourceType: path.split("/")[3] || "RECORD",
        method: req.method,
        endpoint: path,
        status: res.statusCode,
        ipAddress: ip,
        userAgent: req.get("user-agent"),
        requestId,
        changesBefore: null,
        changesAfter: maskPayload(req.body),
      });
    }
  });

  next();
};

/**
 * @desc Maintenance mode blocker
 */
const maintenanceGuard = async (req, res, next) => {
  try {
    const config = await systemAdministrationService.getConfiguration();

    const bypassPaths = ["/api/auth/login", "/api/system/health"];
    const isBypass = bypassPaths.includes(req.originalUrl.split("?")[0]);

    if (config.maintenanceMode && !isBypass) {
      if (!req.user || req.user.role !== "admin") {
        return res.status(503).json({
          success: false,
          message: config.maintenanceMessage || "System is undergoing maintenance. Try again later.",
        });
      }
    }
  } catch (e) {
    console.error("Maintenance check error:", e.message);
  }
  next();
};

module.exports = {
  auditLogger,
  maintenanceGuard,
};
