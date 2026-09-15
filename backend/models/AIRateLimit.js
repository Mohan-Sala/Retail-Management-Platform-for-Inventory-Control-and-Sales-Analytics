const mongoose = require("mongoose");

const aiRateLimitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },
    timestamps: [
      {
        type: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AIRateLimit", aiRateLimitSchema);
