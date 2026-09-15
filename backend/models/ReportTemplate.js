const mongoose = require("mongoose");

const reportTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Report type is required"],
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    scope: {
      type: String,
      enum: ["private", "public", "organization"],
      default: "private",
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReportTemplate", reportTemplateSchema);
