const mongoose = require("mongoose");

const systemAuditSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userRole: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    module: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
    },
    method: {
      type: String,
    },
    endpoint: {
      type: String,
    },
    status: {
      type: Number,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    requestId: {
      type: String,
    },
    changesBefore: {
      type: mongoose.Schema.Types.Mixed,
    },
    changesAfter: {
      type: mongoose.Schema.Types.Mixed,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Pre-validate middleware to auto-populate module and resourceType if missing
systemAuditSchema.pre("validate", function () {
  if (!this.module) {
    this.module = "system";
  }
  if (!this.resourceType) {
    this.resourceType = "audit";
  }
});

const blockUpdate = function (next) {
  next(new Error("Immutable audit logs cannot be updated or modified."));
};

systemAuditSchema.pre("save", function (next) {
  if (!this.isNew) {
    throw new Error("Immutable audit logs cannot be updated or modified.");
  }
  if (typeof next === "function") {
    next();
  }
});

systemAuditSchema.pre("updateOne", blockUpdate);
systemAuditSchema.pre("findOneAndUpdate", blockUpdate);
systemAuditSchema.pre("updateMany", blockUpdate);

module.exports = mongoose.model("SystemAudit", systemAuditSchema);
