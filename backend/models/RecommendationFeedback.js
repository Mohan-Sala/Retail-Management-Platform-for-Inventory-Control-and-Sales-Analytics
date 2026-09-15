const mongoose = require("mongoose");

const recommendationFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    recommendationId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["VIEWED", "CLICKED", "PURCHASED", "DISMISSED", "NOT_INTERESTED"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

recommendationFeedbackSchema.index({ customerId: 1, productId: 1, recommendationId: 1, action: 1 }, { unique: true });

module.exports = mongoose.model("RecommendationFeedback", recommendationFeedbackSchema);
