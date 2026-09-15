const mongoose = require("mongoose");

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    inAppEnabled: {
      type: Boolean,
      default: true,
    },
    pushEnabled: {
      type: Boolean,
      default: false,
    },
    categories: {
      type: [String],
      enum: ["inventory", "sales", "customer", "vendor", "forecast", "reports", "ai", "system"],
      default: ["inventory", "sales", "customer", "vendor", "forecast", "reports", "ai", "system"],
    },
    quietHours: {
      start: {
        type: String,
        default: "",
      },
      end: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("NotificationPreference", notificationPreferenceSchema);
