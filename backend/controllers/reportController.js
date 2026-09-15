const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Report = require("../models/Report");
const ReportSchedule = require("../models/ReportSchedule");
const ReportShare = require("../models/ReportShare");
const ReportTemplate = require("../models/ReportTemplate");
const Vendor = require("../models/Vendor");
const reportQueue = require("../services/reportQueue");
const reportAnalyticsService = require("../services/reportAnalyticsService");
const ReportStorageService = require("../services/ReportStorageService");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * @desc Generate report dynamically (Adds job to queue)
 * @route POST /api/reports/generate
 */
const generateReport = async (req, res, next) => {
  try {
    const { title, type, format, filters = {} } = req.body;

    if (!title || !type || !format) {
      throw new ApiError(400, "Title, Type, and Format are required parameters.");
    }

    // Role checking
    if (req.user.role === "staff" && type === "executive") {
      throw new ApiError(403, "Access Denied: Staff cannot compile Executive reports.");
    }

    // Vendor isolation filter
    if (req.user.role === "vendor") {
      const vendorDoc = await Vendor.findOne({ email: req.user.email });
      if (!vendorDoc) {
        throw new ApiError(403, "Vendor profile not found");
      }
      filters.vendorId = vendorDoc._id.toString();
    }

    // Version tracking
    const lastReport = await Report.findOne({
      creatorId: req.user._id,
      type,
      format,
      isDeleted: false,
    }).sort({ version: -1 });

    const newVersion = lastReport ? lastReport.version + 1 : 1;

    // Trigger queue job
    const job = await reportQueue.addJobToQueue({
      title,
      type,
      format,
      filters,
      creatorId: req.user._id,
      previousVersionId: lastReport ? lastReport._id : null,
      version: newVersion,
    });

    // Invalidate prior versions latest flag if new version completes
    if (lastReport) {
      await Report.updateMany(
        { creatorId: req.user._id, type, format, _id: { $ne: job._id } },
        { latestVersion: false }
      );
    }

    res.status(202).json({
      success: true,
      message: "Report generation job added to background processing queue",
      data: {
        jobId: job._id,
        status: job.status,
        progress: job.progress,
        version: job.version,
        estimatedCompletionTime: "15s",
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get status of report generation job
 * @route GET /api/reports/queue/:jobId
 */
const getJobStatus = async (req, res, next) => {
  try {
    const job = await Report.findOne({ _id: req.params.jobId, creatorId: req.user._id });
    if (!job) {
      throw new ApiError(404, "Report job not found");
    }

    res.status(200).json({
      success: true,
      message: "Report job status retrieved",
      data: {
        jobId: job._id,
        status: job.status,
        progress: job.progress,
        errorMessage: job.errorMessage || null,
        currentStage: job.status === "completed" ? "Done" : job.status === "processing" ? "Compiling data sets" : "Queued in worker pool",
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Cancel queued report job
 * @route POST /api/reports/queue/:jobId/cancel
 */
const cancelJob = async (req, res, next) => {
  try {
    const job = await Report.findOneAndUpdate(
      { _id: req.params.jobId, creatorId: req.user._id, status: "queued" },
      { status: "cancelled", failedAt: new Date() },
      { new: true }
    );

    if (!job) {
      throw new ApiError(400, "Unable to cancel job. It may already be running or completed.");
    }

    res.status(200).json({
      success: true,
      message: "Report job cancelled successfully",
      data: job
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get report history
 * @route GET /api/reports/history
 */
const getReportHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = { creatorId: req.user._id, isDeleted: false };
    if (type) filter.type = type;

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      message: "Report history retrieved successfully",
      data: {
        reports,
        pagination: {
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
          total,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Secure file download endpoint
 * @route GET /api/reports/download/:id
 */
const downloadReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, isDeleted: false });
    if (!report || report.status !== "completed") {
      throw new ApiError(404, "Completed report file not found");
    }

    // Role-based verification
    if (req.user.role !== "admin" && report.creatorId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Access Denied: You do not own this report");
    }

    const buffer = await ReportStorageService.getFileBuffer(report.fileUrl);

    // Update metrics
    report.downloadCount += 1;
    report.lastDownloadedAt = new Date();
    await report.save();

    const contentType = report.format === "pdf" ? "application/pdf" : report.format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="report_${report._id}.${report.format}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Share report links
 * @route POST /api/reports/share/:id
 */
const shareReport = async (req, res, next) => {
  try {
    const { password, expiryDays, downloadLimit, maxUniqueViewers } = req.body;

    const report = await Report.findOne({ _id: req.params.id, creatorId: req.user._id, isDeleted: false });
    if (!report) {
      throw new ApiError(404, "Report not found");
    }

    const token = crypto.randomBytes(32).toString("hex");
    let passwordHash = undefined;
    if (password) {
      passwordHash = bcrypt.hashSync(password, 10);
    }

    const expiryDate = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : undefined;

    const share = await ReportShare.create({
      reportId: report._id,
      token,
      passwordHash,
      expiryDate,
      downloadLimit,
      maxUniqueViewers,
    });

    report.shareCount += 1;
    await report.save();

    res.status(200).json({
      success: true,
      message: "Secure share link generated successfully",
      data: {
        shareId: share._id,
        shareToken: token,
        expiryDate: share.expiryDate || null,
        downloadLimit: share.downloadLimit || null,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get shared link details
 * @route GET /api/reports/shared/:token
 */
const getSharedReport = async (req, res, next) => {
  try {
    const share = await ReportShare.findOne({ token: req.params.token, isRevoked: false });
    if (!share) {
      throw new ApiError(404, "Shared report link not found or has been revoked");
    }

    if (share.expiryDate && new Date() > new Date(share.expiryDate)) {
      throw new ApiError(410, "Shared report link has expired");
    }

    if (share.downloadLimit && share.downloadCount >= share.downloadLimit) {
      throw new ApiError(429, "Shared report download limit reached");
    }

    // Verify Password if requested
    const passwordInput = req.headers["x-share-password"];
    if (share.passwordHash) {
      if (!passwordInput) {
        return res.status(401).json({
          success: false,
          message: "Password required to access this report link",
          data: { passwordRequired: true }
        });
      }
      const verified = bcrypt.compareSync(passwordInput, share.passwordHash);
      if (!verified) {
        share.accessHistory.push({
          ip: req.ip,
          userAgent: req.headers["user-agent"] || "Unknown",
          success: false,
        });
        await share.save();
        throw new ApiError(401, "Invalid password credentials");
      }
    }

    const report = await Report.findById(share.reportId);
    if (!report || report.isDeleted) {
      throw new ApiError(404, "Underlying report has been deleted");
    }

    // Update access audit log
    share.downloadCount += 1;
    share.accessHistory.push({
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "Unknown",
      success: true,
    });
    await share.save();

    const buffer = await ReportStorageService.getFileBuffer(report.fileUrl);
    const contentType = report.format === "pdf" ? "application/pdf" : report.format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="shared_report_${report._id}.${report.format}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Revoke shared link
 * @route PUT /api/reports/share/:id/revoke
 */
const revokeShare = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, creatorId: req.user._id });
    if (!report) {
      throw new ApiError(404, "Report not found");
    }

    await ReportShare.updateMany({ reportId: report._id }, { isRevoked: true });

    res.status(200).json({
      success: true,
      message: "All active shared links for this report successfully revoked",
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Schedules management CRUDS
 */
const createSchedule = async (req, res, next) => {
  try {
    const { title, type, frequency, filters = {}, format, recipientEmails, timezone } = req.body;

    if (!title || !type || !frequency || !format) {
      throw new ApiError(400, "Required scheduling fields missing");
    }

    const schedule = await ReportSchedule.create({
      title,
      type,
      frequency,
      filters,
      format,
      recipientEmails,
      timezone: timezone || "UTC",
      creatorId: req.user._id,
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default tomorrow
    });

    res.status(201).json({
      success: true,
      message: "Report schedule created successfully",
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

const getSchedules = async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { creatorId: req.user._id };
    const schedules = await ReportSchedule.find(filter).lean();
    res.status(200).json({
      success: true,
      message: "Report schedules retrieved",
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

const toggleSchedule = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const schedule = await ReportSchedule.findOneAndUpdate(
      { _id: req.params.id, creatorId: req.user._id },
      { isActive: !!isActive },
      { new: true }
    );

    if (!schedule) {
      throw new ApiError(404, "Report schedule not found");
    }

    res.status(200).json({
      success: true,
      message: `Report schedule ${isActive ? "enabled" : "paused"} successfully`,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const result = await ReportSchedule.deleteOne({ _id: req.params.id, creatorId: req.user._id });
    if (result.deletedCount === 0) {
      throw new ApiError(404, "Report schedule not found");
    }
    res.status(200).json({
      success: true,
      message: "Report schedule deleted successfully",
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Templates management CRUDS
 */
const createTemplate = async (req, res, next) => {
  try {
    const { name, type, filters = {}, scope, isFavorite, isDefault } = req.body;

    if (!name || !type) {
      throw new ApiError(400, "Template name and type are required");
    }

    const template = await ReportTemplate.create({
      name,
      type,
      filters,
      scope: scope || "private",
      creatorId: req.user._id,
      isFavorite: !!isFavorite,
      isDefault: !!isDefault,
    });

    res.status(201).json({
      success: true,
      message: "Report template saved successfully",
      data: template
    });
  } catch (error) {
    next(error);
  }
};

const getTemplates = async (req, res, next) => {
  try {
    const filter = {
      $or: [
        { creatorId: req.user._id },
        { scope: "public" }
      ]
    };
    const templates = await ReportTemplate.find(filter).lean();
    res.status(200).json({
      success: true,
      message: "Report templates retrieved",
      data: templates
    });
  } catch (error) {
    next(error);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const result = await ReportTemplate.deleteOne({ _id: req.params.id, creatorId: req.user._id });
    if (result.deletedCount === 0) {
      throw new ApiError(404, "Template not found");
    }
    res.status(200).json({
      success: true,
      message: "Template deleted successfully",
      data: null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get aggregated reports metrics
 * @route GET /api/reports/analytics
 */
const getReportsStats = async (req, res, next) => {
  try {
    let vendorId = null;
    if (req.user.role === "vendor") {
      const vendorDoc = await Vendor.findOne({ email: req.user.email });
      if (vendorDoc) {
        vendorId = vendorDoc._id.toString();
      }
    }

    const stats = await reportAnalyticsService.getReportAnalytics(req.user, vendorId);
    res.status(200).json({
      success: true,
      message: "AI Reports metrics compiled",
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Soft delete report history entry
 * @route DELETE /api/reports/history/:id
 */
const deleteHistoryItem = async (req, res, next) => {
  try {
    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, creatorId: req.user._id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!report) {
      throw new ApiError(404, "Report not found");
    }

    res.status(200).json({
      success: true,
      message: "Report deleted from history successfully",
      data: null
    });
  } catch (error) {
    next(error);
  }
};

const getReportVersions = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      throw new ApiError(404, "Report not found");
    }

    const versions = await Report.find({
      creatorId: report.creatorId,
      type: report.type,
      format: report.format,
      isDeleted: false,
    }).sort({ version: -1 }).lean();

    res.status(200).json({
      success: true,
      message: "Report versions retrieved successfully",
      data: versions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReport,
  getJobStatus,
  cancelJob,
  getReportHistory,
  downloadReport,
  shareReport,
  getSharedReport,
  revokeShare,
  createSchedule,
  getSchedules,
  toggleSchedule,
  deleteSchedule,
  createTemplate,
  getTemplates,
  deleteTemplate,
  getReportsStats,
  deleteHistoryItem,
  getReportVersions,
};
