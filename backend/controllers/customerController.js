const customerService = require("../services/customerService");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

/**
 * Helper to log standardized audit records
 */
const logAudit = (email, role, ip, operation, entity, entityId) => {
  console.log(`[AUDIT]
Timestamp: ${new Date().toISOString()}
User: ${email}
Role: ${role}
IP: ${ip}
Operation: ${operation}
Entity: ${entity}
Entity ID: ${entityId}`);
};

/**
 * @desc Get all customers
 * @route GET /api/customers
 */
const getCustomers = async (req, res, next) => {
  try {
    const query = { ...req.query };

    // Vendors can never see inactive customers
    if (req.user.role !== "admin") {
      delete query.includeInactive;
    }

    const result = await customerService.getCustomers(query);
    
    // Send response formatted with pagination
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.data.customers,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single customer by ID
 * @route GET /api/customers/:id
 */
const getCustomer = async (req, res, next) => {
  try {
    const result = await customerService.getCustomerById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create customer
 * @route POST /api/customers
 */
const createCustomer = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Forbidden: Only administrators can create customer records");
    }

    const result = await customerService.createCustomer(req.body, req.user._id);

    logAudit(
      req.user.email,
      req.user.role,
      req.ip,
      "CREATE CUSTOMER",
      "Customer",
      result.data._id.toString()
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update customer
 * @route PUT /api/customers/:id
 */
const updateCustomer = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Forbidden: Only administrators can update customer records");
    }

    const result = await customerService.updateCustomer(req.params.id, req.body);

    logAudit(
      req.user.email,
      req.user.role,
      req.ip,
      "UPDATE CUSTOMER",
      "Customer",
      req.params.id
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete customer
 * @route DELETE /api/customers/:id
 */
const deleteCustomer = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Forbidden: Only administrators can delete customer records");
    }

    const result = await customerService.deleteCustomer(req.params.id);

    logAudit(
      req.user.email,
      req.user.role,
      req.ip,
      "DELETE CUSTOMER",
      "Customer",
      req.params.id
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
