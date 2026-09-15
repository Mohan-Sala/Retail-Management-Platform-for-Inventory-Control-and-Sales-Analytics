const BusinessInsight = require("../models/BusinessInsight");

/**
 * @desc Get consolidated counts and averages from the BusinessInsight collection
 */
const getInsightsAnalytics = async (user) => {
  const total = await BusinessInsight.countDocuments({});
  const read = await BusinessInsight.countDocuments({ isRead: true });
  const archived = await BusinessInsight.countDocuments({ isArchived: true });
  const dismissed = await BusinessInsight.countDocuments({ isDismissed: true });

  const categories = await BusinessInsight.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);

  const priorities = await BusinessInsight.aggregate([
    { $group: { _id: "$priority", count: { $sum: 1 } } }
  ]);

  const types = await BusinessInsight.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ]);

  const avgScores = await BusinessInsight.aggregate([
    { $group: { _id: null, avgImpact: { $avg: "$impactScore" }, avgConf: { $avg: "$confidenceScore" } } }
  ]);

  return {
    totalInsights: total,
    insightsByCategory: categories.map(c => ({ category: c._id, count: c.count })),
    insightsByPriority: priorities.map(p => ({ priority: p._id, count: p.count })),
    insightsByType: types.map(t => ({ type: t._id, count: t.count })),
    averageImpactScore: Math.round(avgScores[0]?.avgImpact || 0),
    averageConfidenceScore: Math.round(avgScores[0]?.avgConf || 0),
    readRate: total > 0 ? Math.round((read / total) * 100) : 0,
    archiveRate: total > 0 ? Math.round((archived / total) * 100) : 0,
    dismissRate: total > 0 ? Math.round((dismissed / total) * 100) : 0,
  };
};

module.exports = {
  getInsightsAnalytics,
};
