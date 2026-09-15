const mongoose = require("mongoose");

const aiSettingsSchema = new mongoose.Schema(
  {
    primaryModel: {
      type: String,
      default: "gemini-1.5-flash",
    },
    fallbackModel: {
      type: String,
      default: "gemini-1.5-pro",
    },
    temperature: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 2,
    },
    topP: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    maxTokens: {
      type: Number,
      default: 1000,
      min: 1,
      max: 8192,
    },
    cacheTtl: {
      type: Number,
      default: 300,
      min: 0,
    },
    memorySize: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    streamingEnabled: {
      type: Boolean,
      default: true,
    },
    saveHistory: {
      type: Boolean,
      default: true,
    },
    promptVersion: {
      type: String,
      default: "1.0.0",
    },
    requestTimeout: {
      type: Number,
      default: 30,
      min: 1,
    },
    streamPersistenceInterval: {
      type: Number,
      default: 3,
      min: 1,
    },
    retentionDays: {
      type: Number,
      default: 30,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AISettings", aiSettingsSchema);
