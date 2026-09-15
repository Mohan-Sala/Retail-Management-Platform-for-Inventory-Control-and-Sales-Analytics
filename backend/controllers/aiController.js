const aiService = require("../services/aiService");
const aiAnalyticsService = require("../services/aiAnalyticsService");
const ChatHistory = require("../models/ChatHistory");
const Conversation = require("../models/Conversation");
const AIFeedback = require("../models/AIFeedback");
const AISettings = require("../models/AISettings");
const Vendor = require("../models/Vendor");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get global system health status
 * @route GET /api/chat/health
 */
const getAIHealth = async (req, res, next) => {
  try {
    const settings = await AISettings.findOne() || new AISettings();
    const startTime = Date.now();
    
    // Test Gemini connection latency with a small echo payload
    let reachability = "REACHABLE";
    let latency = 0;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing API Key");
      latency = Date.now() - startTime;
    } catch (e) {
      reachability = "UNREACHABLE";
    }

    const memory = process.memoryUsage();
    
    res.status(200).json(
      new ApiResponse(200, {
        provider: "google-gemini",
        activeModel: settings.primaryModel,
        fallbackModel: settings.fallbackModel,
        status: reachability === "REACHABLE" ? "HEALTHY" : "DEGRADED",
        apiReachable: reachability === "REACHABLE",
        latency: `${latency}ms`,
        uptime: `${Math.round(process.uptime())}s`,
        memoryUsage: {
          heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
        },
        settingsVersion: settings.promptVersion,
        streamingEnabled: settings.streamingEnabled,
        cacheStatus: "ACTIVE",
      }, "AI Service Health verified successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Ask AI Assistant (Supports SSE Streaming & fallback model retries)
 * @route POST /api/chat
 */
const askAIAssistant = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { message, conversationId } = req.body;

    // Validate inputs
    if (!message || typeof message !== "string" || message.trim() === "") {
      throw new ApiError(400, "Message query is required");
    }

    if (message.length > 1000) {
      throw new ApiError(400, "Message length cannot exceed 1000 characters");
    }

    const settings = await AISettings.findOne() || new AISettings();

    // Resolve or create Conversation thread
    let conversation;
    if (conversationId && conversationId !== "new") {
      conversation = await Conversation.findOne({ _id: conversationId, userId: req.user._id, isDeleted: false });
      if (!conversation) {
        throw new ApiError(404, "Active conversation thread not found");
      }
    } else {
      const generatedTitle = message.substring(0, 45) + (message.length > 45 ? "..." : "");
      conversation = await Conversation.create({
        userId: req.user._id,
        role: req.user.role,
        title: generatedTitle,
        messageCount: 0,
      });
    }

    // Resolve Vendor Scoping
    let vendorId = null;
    if (req.user.role === "vendor") {
      const vendorDoc = await Vendor.findOne({ email: req.user.email });
      if (vendorDoc) {
        vendorId = vendorDoc._id.toString();
      }
    }

    // Set up connection for SSE if requested
    const isStreamingRequest = req.headers.accept === "text/event-stream" && settings.streamingEnabled;

    if (isStreamingRequest) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });

      // Handle cancel abort signals
      const abortController = new AbortController();
      req.on("close", () => {
        console.log("[AI Stream] Client connection closed. Aborting request...");
        abortController.abort();
      });

      // Create initial ChatHistory entry
      const chatHistoryDoc = await ChatHistory.create({
        userId: req.user._id,
        role: req.user.role,
        conversationId: conversation._id,
        question: message.trim(),
        answer: "",
        tokens: 0,
        provider: "gemini",
        model: settings.primaryModel,
      });

      let accumulatedAnswer = "";
      let lastSavedTime = Date.now();

      try {
        const aiRes = await aiService.getAIResponse(
          req.user,
          message.trim(),
          vendorId,
          (chunk) => {
            accumulatedAnswer += chunk;
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);

            // Incremental persistence
            const timeDiff = Date.now() - lastSavedTime;
            if (timeDiff > settings.streamPersistenceInterval * 1000) {
              lastSavedTime = Date.now();
              ChatHistory.findByIdAndUpdate(chatHistoryDoc._id, { answer: accumulatedAnswer }).exec();
            }
          },
          abortController.signal
        );

        // Update final message fields
        const finalTime = Date.now() - startTime;
        chatHistoryDoc.answer = accumulatedAnswer;
        chatHistoryDoc.tokens = aiRes.tokens || Math.round(accumulatedAnswer.length / 4);
        chatHistoryDoc.responseTime = finalTime;
        chatHistoryDoc.sources = aiRes.sources || [];
        chatHistoryDoc.confidence = aiRes.confidence || 95;
        chatHistoryDoc.model = aiRes.model;
        await chatHistoryDoc.save();

        // Update Conversation details
        conversation.lastMessageAt = new Date();
        conversation.messageCount += 1;
        conversation.lastMessage = accumulatedAnswer.substring(0, 150);
        await conversation.save();

        // Write done payload
        res.write(
          `data: ${JSON.stringify({
            done: true,
            messageId: chatHistoryDoc._id,
            conversationId: conversation._id,
            sources: aiRes.sources || [],
            confidence: aiRes.confidence || 95,
            responseTime: finalTime,
          })}\n\n`
        );
        res.end();
      } catch (err) {
        // Save whatever we got before error/abort
        if (accumulatedAnswer) {
          chatHistoryDoc.answer = accumulatedAnswer;
          chatHistoryDoc.responseTime = Date.now() - startTime;
          await chatHistoryDoc.save();
        }
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming fallback
      const aiRes = await aiService.getAIResponse(req.user, message.trim(), vendorId);
      const responseTime = Date.now() - startTime;

      const chatHistoryDoc = await ChatHistory.create({
        userId: req.user._id,
        role: req.user.role,
        conversationId: conversation._id,
        question: message.trim(),
        answer: aiRes.answer,
        tokens: aiRes.tokens || 0,
        provider: aiRes.provider,
        model: aiRes.model,
        responseTime,
        sources: aiRes.sources,
        confidence: aiRes.confidence,
        cacheHit: aiRes.cacheHit || false,
      });

      // Update Conversation details
      conversation.lastMessageAt = new Date();
      conversation.messageCount += 1;
      conversation.lastMessage = aiRes.answer.substring(0, 150);
      await conversation.save();

      // Standard JSON return
      res.status(200).json({
        success: true,
        answer: aiRes.answer,
        conversationId: conversation._id,
        messageId: chatHistoryDoc._id,
        sources: aiRes.sources,
        confidence: aiRes.confidence,
        cacheHit: aiRes.cacheHit || false,
        usage: {
          totalTokens: aiRes.tokens,
          provider: aiRes.provider,
          model: aiRes.model,
        },
        responseTime,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get User's Conversations (Grouped into: Today, Yesterday, Last 7 Days, Last 30 Days, Older)
 * @route GET /api/chat/conversations
 */
const getConversations = async (req, res, next) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Filter conversations
    const filter = { userId: req.user._id, isDeleted: false };

    // Support Full-text search highlighting across title, prompts, and responses
    let highlightedMatches = new Map();
    if (search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      
      // Find matching ChatHistory messages
      const matchMessages = await ChatHistory.find({
        userId: req.user._id,
        $or: [
          { question: searchRegex },
          { answer: searchRegex }
        ]
      }).select("conversationId question answer").lean();

      const matchedConvIds = matchMessages.map((m) => m.conversationId?.toString()).filter(Boolean);

      // Build text highlight map
      matchMessages.forEach((m) => {
        const cid = m.conversationId.toString();
        const snippet = `Q: ${m.question.substring(0, 40)}... A: ${m.answer.substring(0, 60)}...`;
        const highlighted = snippet.replace(searchRegex, (match) => `<mark class="bg-primary/20 text-foreground px-0.5 rounded">${match}</mark>`);
        highlightedMatches.set(cid, highlighted);
      });

      filter.$or = [
        { title: searchRegex },
        { _id: { $in: matchedConvIds } }
      ];
    }

    const total = await Conversation.countDocuments(filter);
    const conversations = await Conversation.find(filter)
      .sort({ isPinned: -1, lastMessageAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Grouping calculations
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - oneDay;
    const sevenDaysAgo = todayStart - 6 * oneDay;
    const thirtyDaysAgo = todayStart - 29 * oneDay;

    const grouped = {
      pinned: [],
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      older: [],
    };

    conversations.forEach((c) => {
      const item = {
        id: c._id.toString(),
        title: c.title,
        isPinned: c.isPinned,
        isArchived: c.isArchived,
        messageCount: c.messageCount,
        lastMessage: c.lastMessage || "",
        lastMessageAt: c.lastMessageAt,
        highlightedSnippet: highlightedMatches.get(c._id.toString()) || null,
      };

      if (c.isPinned) {
        grouped.pinned.push(item);
        return;
      }

      const ts = new Date(c.lastMessageAt).getTime();
      if (ts >= todayStart) {
        grouped.today.push(item);
      } else if (ts >= yesterdayStart) {
        grouped.yesterday.push(item);
      } else if (ts >= sevenDaysAgo) {
        grouped.last7Days.push(item);
      } else if (ts >= thirtyDaysAgo) {
        grouped.last30Days.push(item);
      } else {
        grouped.older.push(item);
      }
    });

    res.status(200).json(
      new ApiResponse(200, {
        grouped,
        pagination: {
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
          total,
        }
      }, "Conversations retrieved successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get paginated messages in a conversation
 * @route GET /api/chat/conversations/:id/messages
 */
const getConversationMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Verify conversation ownership
    const conv = await Conversation.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: false });
    if (!conv) {
      throw new ApiError(404, "Conversation thread not found");
    }

    const total = await ChatHistory.countDocuments({ conversationId: conv._id });
    const messages = await ChatHistory.find({ conversationId: conv._id })
      .sort({ createdAt: 1 }) // Chronological order
      .skip(skip)
      .limit(limitNum)
      .lean();

    const formattedMessages = messages.map((m) => ({
      id: m._id.toString(),
      question: m.question,
      answer: m.answer,
      sources: m.sources || [],
      confidence: m.confidence || 95,
      responseTime: m.responseTime,
      createdAt: m.createdAt,
    }));

    res.status(200).json(
      new ApiResponse(200, {
        messages: formattedMessages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
          total,
        }
      }, "Conversation messages retrieved successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Rename conversation
 * @route PUT /api/chat/conversations/:id/rename
 */
const renameConversation = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== "string" || title.trim() === "") {
      throw new ApiError(400, "Title is required");
    }

    const conv = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { title: title.trim() },
      { new: true }
    );

    if (!conv) {
      throw new ApiError(404, "Conversation thread not found");
    }

    res.status(200).json(new ApiResponse(200, conv, "Conversation renamed successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Toggle Pin status
 * @route PUT /api/chat/conversations/:id/pin
 */
const togglePinConversation = async (req, res, next) => {
  try {
    const { isPinned } = req.body;
    const conv = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { isPinned: !!isPinned },
      { new: true }
    );

    if (!conv) {
      throw new ApiError(404, "Conversation thread not found");
    }

    res.status(200).json(new ApiResponse(200, conv, `Conversation ${isPinned ? "pinned" : "unpinned"} successfully`));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Toggle Archive status
 * @route PUT /api/chat/conversations/:id/archive
 */
const toggleArchiveConversation = async (req, res, next) => {
  try {
    const { isArchived } = req.body;
    const conv = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { isArchived: !!isArchived },
      { new: true }
    );

    if (!conv) {
      throw new ApiError(404, "Conversation thread not found");
    }

    res.status(200).json(new ApiResponse(200, conv, `Conversation ${isArchived ? "archived" : "restored"} successfully`));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Soft delete conversation
 * @route DELETE /api/chat/conversations/:id
 */
const deleteConversation = async (req, res, next) => {
  try {
    const conv = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!conv) {
      throw new ApiError(404, "Conversation thread not found");
    }

    res.status(200).json(new ApiResponse(200, null, "Conversation deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Bulk soft delete conversations
 * @route POST /api/chat/conversations/bulk-delete
 */
const bulkDeleteConversations = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, "Array of Conversation IDs is required");
    }

    await Conversation.updateMany(
      { _id: { $in: ids }, userId: req.user._id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() }
    );

    res.status(200).json(new ApiResponse(200, null, "Conversations deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc GET AI settings singleton
 * @route GET /api/chat/settings
 */
const getAISettings = async (req, res, next) => {
  try {
    const settings = await AISettings.findOne() || await AISettings.create({});
    res.status(200).json(new ApiResponse(200, settings, "AI Settings retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update AI Settings (Admin only)
 * @route PUT /api/chat/settings
 */
const updateAISettings = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Forbidden. Admin access required.");
    }

    const { temperature, topP, maxTokens, cacheTtl, memorySize } = req.body;

    const updated = await AISettings.findOneAndUpdate(
      {},
      { temperature, topP, maxTokens, cacheTtl, memorySize },
      { new: true, upsert: true }
    );

    res.status(200).json(new ApiResponse(200, updated, "AI Settings updated successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get AI Analytics Scoped stats
 * @route GET /api/chat/analytics
 */
const getChatAnalytics = async (req, res, next) => {
  try {
    let vendorId = null;
    if (req.user.role === "vendor") {
      const vendorDoc = await Vendor.findOne({ email: req.user.email });
      if (vendorDoc) {
        vendorId = vendorDoc._id.toString();
      }
    }

    const stats = await aiAnalyticsService.getAIAnalytics(req.user, vendorId);
    res.status(200).json(new ApiResponse(200, stats, "AI Usage Analytics compiled successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Post / Update conversation feedback
 * @route POST /api/chat/feedback
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { conversationId, messageId, rating, feedback } = req.body;

    if (!messageId || !conversationId || rating === undefined) {
      throw new ApiError(400, "conversationId, messageId and rating are required");
    }

    // Upsert feedback to prevent duplicates
    const feed = await AIFeedback.findOneAndUpdate(
      { userId: req.user._id, messageId },
      { conversationId, rating, feedback },
      { new: true, upsert: true }
    );

    res.status(200).json(new ApiResponse(200, feed, "Feedback submitted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete feedback
 * @route DELETE /api/chat/feedback/:messageId
 */
const deleteFeedback = async (req, res, next) => {
  try {
    const result = await AIFeedback.deleteOne({ userId: req.user._id, messageId: req.params.messageId });
    if (result.deletedCount === 0) {
      throw new ApiError(404, "Feedback record not found");
    }
    res.status(200).json(new ApiResponse(200, null, "Feedback deleted successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  askAIAssistant,
  getConversations,
  getConversationMessages,
  renameConversation,
  togglePinConversation,
  toggleArchiveConversation,
  deleteConversation,
  bulkDeleteConversations,
  getAISettings,
  updateAISettings,
  getChatAnalytics,
  getAIHealth,
  submitFeedback,
  deleteFeedback,
};
