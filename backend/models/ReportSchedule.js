const mongoose = require("mongoose");

const reportScheduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Schedule title is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Report type is required"],
    },
    frequency: {
      type: String,
      required: [true, "Frequency is required"],
      enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    format: {
      type: String,
      required: [true, "Format is required"],
      enum: ["pdf", "xlsx", "csv"],
    },
    recipientEmails: [
      {
        type: String,
        trim: true,
      },
    ],
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    lastRunAt: {
      type: Date,
    },
    nextRunAt: {
      type: Date,
      index: true,
    },
    consecutiveFailureCount: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReportSchedule", reportScheduleSchema);
