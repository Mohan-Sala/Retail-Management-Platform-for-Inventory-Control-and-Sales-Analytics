const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["admin", "vendor", "manager", "staff", "customer"],
      required: [true, "Role is required"],
    },
    businessName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "locked"],
      default: "active",
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastLogin: Date,
    lastActivity: Date,
    passwordChangedAt: Date,
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    profilePhoto: String,
    department: String,
    designation: String,
    timezone: {
      type: String,
      default: "UTC",
    },
    language: {
      type: String,
      default: "en",
    },
    theme: {
      type: String,
      default: "system",
    },
    notificationSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: String,
    updatedBy: String,
    customerProfile: {
      customerStatus: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
      },
      customerSince: {
        type: Date,
        default: Date.now
      },
      totalOrders: {
        type: Number,
        default: 0
      },
      totalSpent: {
        type: Number,
        default: 0
      },
      favoriteVendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    }
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model("User", userSchema);
module.exports = User;