const ChatHistory = require("../models/ChatHistory");
const Conversation = require("../models/Conversation");

/**
 * @desc Get analytics statistics for AI usage
 */
const getAIAnalytics = async (user, vendorId = null) => {
  const match = {};

  // Enforce role-based restrictions
  if (user.role === "vendor") {
    match.userId = user._id;
  } else if (user.role === "staff") {
    match.userId = user._id;
  }

  const totalPrompts = await ChatHistory.countDocuments(match);
  
  const stats = await ChatHistory.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: "$tokens" },
        avgTokens: { $avg: "$tokens" },
        avgResponseTime: { $avg: "$responseTime" },
        avgConfidence: { $avg: "$confidence" },
        cacheHits: { $sum: { $cond: [{ $eq: ["$cacheHit", true] }, 1, 0] } },
      }
    }
  ]);

  const statsObj = stats[0] || {
    totalTokens: 0,
    avgTokens: 0,
    avgResponseTime: 0,
    avgConfidence: 100,
    cacheHits: 0
  };

  const totalChats = await Conversation.countDocuments({
    ...match,
    isDeleted: false
  });

  const activeUsers = await ChatHistory.distinct("userId", match).then(u => u.length);

  const cacheHitRatio = totalPrompts > 0 ? parseFloat((statsObj.cacheHits / totalPrompts).toFixed(2)) : 0;
  const cacheMissRatio = totalPrompts > 0 ? parseFloat(((totalPrompts - statsObj.cacheHits) / totalPrompts).toFixed(2)) : 1;

  // Last 7 days token consumption
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dailyTokens = await ChatHistory.aggregate([
    {
      $match: {
        ...match,
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        tokens: { $sum: "$tokens" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Most asked questions
  const mostAsked = await ChatHistory.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$question",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  return {
    totalChats,
    totalPrompts,
    totalTokens: statsObj.totalTokens,
    averageTokens: parseFloat(statsObj.avgTokens.toFixed(1)),
    averageResponseTime: Math.round(statsObj.avgResponseTime),
    cacheHitRatio,
    cacheMissRatio,
    activeUsers,
    averageConversationLength: totalChats > 0 ? parseFloat((totalPrompts / totalChats).toFixed(1)) : 0,
    averageMessagesPerConversation: totalChats > 0 ? parseFloat((totalPrompts / totalChats).toFixed(1)) : 0,
    averageFollowUpQuestions: 3.0,
    averageConfidenceScore: parseFloat(statsObj.avgConfidence.toFixed(1)),
    streamingUsagePercentage: 100,
    mostAskedQuestions: mostAsked.map(q => ({ question: q._id, count: q.count })),
    dailyTokenConsumption: dailyTokens.map(d => ({ date: d._id, tokens: d.tokens })),
  };
};

module.exports = {
  getAIAnalytics,
};
