const Report = require("../models/Report");
const ReportSchedule = require("../models/ReportSchedule");

/**
 * @desc Get analytics overview for Smart Reports (RBAC Scoped)
 */
const getReportAnalytics = async (user, vendorId = null) => {
  const match = { isDeleted: false };

  // Role based filtering logic
  if (user.role === "vendor") {
    match.$or = [
      { creatorId: user._id },
      { "filters.vendorId": vendorId }
    ];
  } else if (user.role === "staff") {
    match.creatorId = user._id;
  }

  const totalReports = await Report.countDocuments(match);

  // Aggregations grouped by type
  const typeCounts = await Report.aggregate([
    { $match: match },
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ]);

  // Aggregations grouped by format
  const formatCounts = await Report.aggregate([
    { $match: match },
    { $group: { _id: "$format", count: { $sum: 1 } } }
  ]);

  // Success rates and file size sums
  const successStats = await Report.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        successes: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        failures: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        avgTime: { $avg: "$generationTimeMs" },
        totalSize: { $sum: "$fileSize" },
      }
    }
  ]);

  const successObj = successStats[0] || { successes: 0, failures: 0, avgTime: 0, totalSize: 0 };
  const totalRuns = successObj.successes + successObj.failures;
  const successRate = totalRuns > 0 ? parseFloat(((successObj.successes / totalRuns) * 100).toFixed(1)) : 100;

  // Schedules count
  const scheduleMatch = user.role === "vendor" ? { creatorId: user._id } : {};
  const totalSchedules = await ReportSchedule.countDocuments(scheduleMatch);
  const activeSchedules = await ReportSchedule.countDocuments({ ...scheduleMatch, isActive: true });
  const failedSchedules = await ReportSchedule.countDocuments({ ...scheduleMatch, consecutiveFailureCount: { $gt: 0 } });

  // Top downloads & shares
  const topDownloaded = await Report.find(match)
    .sort({ downloadCount: -1 })
    .limit(5)
    .select("title downloadCount type format")
    .lean();

  const topShared = await Report.find(match)
    .sort({ shareCount: -1 })
    .limit(5)
    .select("title shareCount type format")
    .lean();

  return {
    totalReports,
    successRate,
    averageGenerationTimeMs: Math.round(successObj.avgTime || 0),
    totalStorageUsageBytes: successObj.totalSize || 0,
    reportsByType: typeCounts.map(t => ({ type: t._id, count: t.count })),
    reportsByFormat: formatCounts.map(f => ({ format: f._id, count: f.count })),
    activeSchedules,
    failedSchedules,
    totalSchedules,
    mostDownloaded: topDownloaded.map(d => ({ title: d.title, downloads: d.downloadCount, format: d.format })),
    mostShared: topShared.map(s => ({ title: s.title, shares: s.shareCount, format: s.format })),
  };
};

module.exports = {
  getReportAnalytics,
};
