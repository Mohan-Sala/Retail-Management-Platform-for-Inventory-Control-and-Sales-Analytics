const mongoose = require("mongoose");

const reportLockSchema = new mongoose.Schema(
  {
    lockKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    acquiredAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReportLock", reportLockSchema);
