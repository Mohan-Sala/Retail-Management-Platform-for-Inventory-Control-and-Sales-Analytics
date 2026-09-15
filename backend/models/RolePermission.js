const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      unique: true,
      enum: ["admin", "vendor", "manager", "staff"],
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    description: String,
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
    createdBy: String,
    updatedBy: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RolePermission", rolePermissionSchema);
