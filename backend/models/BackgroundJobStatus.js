const mongoose = require("mongoose");

const backgroundJobStatusSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["idle", "running", "failed", "paused"],
      default: "idle",
    },
    lastRun: {
      type: Date,
      default: Date.now,
    },
    nextRun: {
      type: Date,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
    },
    heartbeat: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BackgroundJobStatus", backgroundJobStatusSchema);
