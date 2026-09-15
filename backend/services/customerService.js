const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
const ApiError = require("../utils/ApiError");

/**
 * @desc Get all customers (supports pagination, search, sorting, filtering)
 */
const getCustomers = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};

  // Handle active status (exclude inactive by default)
  if (query.includeInactive === "true" || query.includeInactive === true) {
    // Keep all including inactive
  } else {
    filter.isActive = true;
  }

  // Handle search (name, email, phone, city)
  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { city: searchRegex },
    ];
  }

  // Handle city filter
  if (query.city && query.city !== "all") {
    filter.city = new RegExp(`^${query.city.trim()}$`, "i");
  }

  // Handle category filter (mapped to totalSpending ranges)
  if (query.category && query.category !== "all") {
    const cat = query.category.trim().toLowerCase();
    if (cat === "gold") {
      filter.totalSpending = { $gte: 5000 };
    } else if (cat === "silver") {
      filter.totalSpending = { $gte: 1500, $lt: 5000 };
    } else if (cat === "bronze") {
      filter.totalSpending = { $lt: 1500 };
    }
  }

  // Handle sorting
  let sort = {};
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sortBy = query.sortBy || "newest";

  if (sortBy === "name") {
    sort.name = sortOrder;
  } else if (sortBy === "orders") {
    sort.totalOrders = sortOrder;
  } else if (sortBy === "spending") {
    sort.totalSpending = sortOrder;
  } else if (sortBy === "oldest") {
    sort.createdAt = 1;
  } else if (sortBy === "newest") {
    sort.createdAt = -1;
  } else {
    // default sort by createdAt desc
    sort.createdAt = -1;
  }

  const total = await Customer.countDocuments(filter);
  const customers = await Customer.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean({ virtuals: true }); // enable lean options

  // Since lean objects don't resolve virtuals by default unless mapped or configured,
  // we will manually add the virtual category for lean objects or use a map
  const customersWithVirtuals = customers.map((c) => {
    let category = "Bronze";
    if (c.totalSpending >= 5000) {
      category = "Gold";
    } else if (c.totalSpending >= 1500) {
      category = "Silver";
    }
    return {
      ...c,
      id: c._id.toString(),
      customerCategory: category,
    };
  });

  const pages = Math.ceil(total / limit) || 1;

  return {
    success: true,
    message: "Customers retrieved successfully",
    data: { customers: customersWithVirtuals },
    pagination: {
      page,
      limit,
      pages,
      total,
    },
  };
};

/**
 * @desc Get customer by ID
 */
const getCustomerById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid customer ID format");
  }

  const customer = await Customer.findById(id).lean();
  if (!customer) {
    throw new ApiError(404, "Customer record not found");
  }

  let category = "Bronze";
  if (customer.totalSpending >= 5000) {
    category = "Gold";
  } else if (customer.totalSpending >= 1500) {
    category = "Silver";
  }

  return {
    success: true,
    message: "Customer record retrieved successfully",
    data: {
      ...customer,
      id: customer._id.toString(),
      customerCategory: category,
    },
  };
};

/**
 * @desc Create new customer record
 */
const createCustomer = async (customerData, adminId) => {
  const { name, phone, email, city, address } = customerData;

  // Basic Validations
  if (!name || name.trim() === "") {
    throw new ApiError(400, "Customer name is required");
  }
  if (!phone || phone.trim() === "") {
    throw new ApiError(400, "Phone number is required");
  }
  if (!email || email.trim() === "") {
    throw new ApiError(400, "Email address is required");
  }
  if (!city || city.trim() === "") {
    throw new ApiError(400, "City is required");
  }

  // Duplicate Check
  const duplicateEmail = await Customer.findOne({ email: email.toLowerCase() });
  if (duplicateEmail) {
    throw new ApiError(409, `Email address '${email}' is already registered to another customer`);
  }

  const duplicatePhone = await Customer.findOne({ phone: phone.trim() });
  if (duplicatePhone) {
    throw new ApiError(409, `Phone number '${phone}' is already registered to another customer`);
  }

  const session = await mongoose.startSession();
  let createdCustomer;
  try {
    session.startTransaction();

    const [customer] = await Customer.create(
      [
        {
          name,
          phone: phone.trim(),
          email: email.toLowerCase(),
          city,
          address,
          createdBy: adminId,
          totalOrders: 0,
          totalSpending: 0,
          isActive: true,
        },
      ],
      { session }
    );
    createdCustomer = customer;

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    if (error.code === 11000) {
      throw new ApiError(409, "Duplicate customer email or phone detected during creation");
    }
    throw error;
  } finally {
    session.endSession();
  }

  try {
    require("./dashboardAnalyticsService").invalidateDashboardCache();
  } catch (err) {
    console.error("Error invalidating cache:", err);
  }

  return {
    success: true,
    message: "Customer profile created successfully",
    data: createdCustomer,
  };
};

/**
 * @desc Update customer record
 */
const updateCustomer = async (id, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid customer ID format");
  }

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer record not found");
  }

  const { name, phone, email, city, address, totalOrders, totalSpending, isActive } = updateData;

  // Basic validations
  if (name !== undefined && name.trim() === "") {
    throw new ApiError(400, "Customer name cannot be empty");
  }
  if (phone !== undefined && phone.trim() === "") {
    throw new ApiError(400, "Phone number cannot be empty");
  }
  if (email !== undefined && email.trim() === "") {
    throw new ApiError(400, "Email address cannot be empty");
  }
  if (city !== undefined && city.trim() === "") {
    throw new ApiError(400, "City cannot be empty");
  }
  if (totalOrders !== undefined && totalOrders < 0) {
    throw new ApiError(400, "Total orders cannot be negative");
  }
  if (totalSpending !== undefined && totalSpending < 0) {
    throw new ApiError(400, "Total spending cannot be negative");
  }

  // Duplicate checks
  if (email) {
    const dup = await Customer.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
    if (dup) {
      throw new ApiError(409, `Email address '${email}' is already registered to another customer`);
    }
  }

  if (phone) {
    const dup = await Customer.findOne({ phone: phone.trim(), _id: { $ne: id } });
    if (dup) {
      throw new ApiError(409, `Phone number '${phone}' is already registered to another customer`);
    }
  }

  const session = await mongoose.startSession();
  let updatedCustomer;
  try {
    session.startTransaction();

    // Map properties
    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email.toLowerCase();
    if (city !== undefined) customer.city = city;
    if (address !== undefined) customer.address = address;
    if (totalOrders !== undefined) customer.totalOrders = totalOrders;
    if (totalSpending !== undefined) customer.totalSpending = totalSpending;
    if (isActive !== undefined) {
      customer.isActive = isActive;
      if (isActive === false) {
        customer.deletedAt = new Date();
      } else {
        customer.deletedAt = null;
      }
    }

    updatedCustomer = await customer.save({ session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    if (error.code === 11000) {
      throw new ApiError(409, "Duplicate customer email or phone detected during update");
    }
    throw error;
  } finally {
    session.endSession();
  }

  try {
    require("./dashboardAnalyticsService").invalidateDashboardCache();
  } catch (err) {
    console.error("Error invalidating cache:", err);
  }

  return {
    success: true,
    message: "Customer profile updated successfully",
    data: updatedCustomer,
  };
};

/**
 * @desc Soft delete customer (mark isActive = false)
 */
const deleteCustomer = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid customer ID format");
  }

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer record not found");
  }

  // Safety check: check if customer has transactions
  const hasTransactions = await Transaction.exists({ customerId: id });
  
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    customer.isActive = false;
    customer.deletedAt = new Date();
    await customer.save({ session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  try {
    require("./dashboardAnalyticsService").invalidateDashboardCache();
  } catch (err) {
    console.error("Error invalidating cache:", err);
  }

  return {
    success: true,
    message: "Customer profile deleted successfully",
    data: null,
  };
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
