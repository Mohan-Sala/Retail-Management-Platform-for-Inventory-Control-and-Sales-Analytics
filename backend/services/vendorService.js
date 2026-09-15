const mongoose = require("mongoose");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const ApiError = require("../utils/ApiError");

/**
 * @desc Helper function to format vendor document for client consumption
 */
const formatVendor = (vendor) => {
  if (!vendor) return null;
  const doc = vendor.toObject ? vendor.toObject() : vendor;
  return {
    id: doc._id.toString(),
    businessName: doc.businessName,
    ownerName: doc.ownerName,
    email: doc.email,
    phone: doc.phone,
    gst: doc.gst,
    address: doc.address,
    city: doc.city,
    status: doc.status,
    commission: doc.commission,
    revenue: doc.revenue,
    productCount: doc.productCount,
    avatar: doc.avatar,
    joinedAt: doc.joinedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

/**
 * @desc Fetch all vendors with searching, sorting, filtering, and pagination
 */
const getAllVendors = async (queryOptions) => {
  const { search, status, sortBy = "createdAt", order = "desc", page = 1, limit = 10 } = queryOptions;

  const filter = {};

  // Apply filters
  if (status) {
    filter.status = status;
  }

  // Apply search
  if (search) {
    filter.$or = [
      { businessName: { $regex: search, $options: "i" } },
      { ownerName: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Sorting
  const sortDirection = order === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortDirection };

  // Run queries
  const total = await Vendor.countDocuments(filter);
  const vendors = await Vendor.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  return {
    vendors: vendors.map(formatVendor),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)) || 1,
    limit: parseInt(limit),
  };
};

/**
 * @desc Get Vendor by ID
 */
const getVendorById = async (id) => {
  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }
  return formatVendor(vendor);
};

/**
 * @desc Create Vendor
 */
const createVendor = async (vendorData) => {
  const { email, gst, businessName, ownerName, phone, address, city, commission, status, avatar } = vendorData;

  // 1. Check unique constraints first (User and Vendor)
  const businessExists = await Vendor.findOne({ businessName });
  if (businessExists) {
    throw new ApiError(400, `Business name '${businessName}' is already registered`);
  }

  const userEmailExists = await User.findOne({ email });
  const vendorEmailExists = await Vendor.findOne({ email });
  if (userEmailExists || vendorEmailExists) {
    throw new ApiError(400, `Email '${email}' is already registered`);
  }

  const gstExists = await Vendor.findOne({ gst });
  if (gstExists) {
    throw new ApiError(400, `GST number '${gst}' is already registered`);
  }

  const defaultPassword = process.env.DEFAULT_PASSWORD || "password123";
  const finalAvatar = avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(businessName || "shopsense")}`;

  let session = null;
  let createdVendor = null;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    // Create User inside transaction
    const [user] = await User.create(
      [
        {
          name: ownerName,
          email,
          password: defaultPassword,
          role: "vendor",
          businessName,
          phone,
          avatar: finalAvatar,
        },
      ],
      { session }
    );

    // Create Vendor inside transaction
    const [vendor] = await Vendor.create(
      [
        {
          businessName,
          ownerName,
          email,
          phone,
          gst,
          address,
          city,
          status: status || "active",
          commission: commission || 10,
          avatar: finalAvatar,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    createdVendor = vendor;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    // Fallback if MongoDB transactions/sessions are not supported (e.g. standalone local DB)
    if (error.message && (error.message.includes("does not support sessions") || error.message.includes("replica set"))) {
      console.warn("[VendorService] Sessions not supported, falling back to manual rollback.");
      
      let createdUser = null;
      try {
        // Create User
        createdUser = await User.create({
          name: ownerName,
          email,
          password: defaultPassword,
          role: "vendor",
          businessName,
          phone,
          avatar: finalAvatar,
        });

        // Create Vendor
        const vendor = await Vendor.create({
          businessName,
          ownerName,
          email,
          phone,
          gst,
          address,
          city,
          status: status || "active",
          commission: commission || 10,
          avatar: finalAvatar,
        });

        createdVendor = vendor;
      } catch (err) {
        // Manual rollback compensating write
        if (createdUser) {
          await User.findByIdAndDelete(createdUser._id);
        }
        throw err;
      }
    } else {
      throw error;
    }
  }

  // Format and include plaintext login credentials only once in API response
  const result = formatVendor(createdVendor);
  result.credentials = {
    email: email,
    password: defaultPassword,
  };
  return result;
};

/**
 * @desc Update Vendor
 */
const updateVendor = async (id, vendorData) => {
  const { email, gst } = vendorData;

  // Check unique constraints if being updated
  if (email) {
    const emailExists = await Vendor.findOne({ email, _id: { $ne: id } });
    if (emailExists) {
      throw new ApiError(400, `Vendor email '${email}' is already registered`);
    }
  }

  if (gst) {
    const gstExists = await Vendor.findOne({ gst, _id: { $ne: id } });
    if (gstExists) {
      throw new ApiError(400, `GST number '${gst}' is already registered`);
    }
  }

  const vendor = await Vendor.findByIdAndUpdate(id, vendorData, {
    new: true,
    runValidators: true,
  });

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return formatVendor(vendor);
};

/**
 * @desc Delete Vendor
 */
const deleteVendor = async (id) => {
  const vendor = await Vendor.findByIdAndDelete(id);
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }
  return formatVendor(vendor);
};

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  formatVendor, // export format helper for reuse
};
