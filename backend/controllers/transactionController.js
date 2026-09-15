const transactionService = require("../services/transactionService");
const ApiResponse = require("../utils/ApiResponse");

/**
 * @desc Get all transactions
 * @route GET /api/transactions
 */
const getTransactions = async (req, res, next) => {
  try {
    const { vendorId, status, sortBy, order, page, limit } = req.query;
    const result = await transactionService.getAllTransactions({ vendorId, status, sortBy, order, page, limit });
    res.status(200).json(new ApiResponse(200, result, "Transactions retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

const getAuditTimestamp = () => new Date().toISOString().replace('T', ' ').split('.')[0];

/**
 * @desc Create a transaction
 * @route POST /api/transactions
 */
const createTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.createTransaction(req.body);

    // Audit Logging
    console.log(`[AUDIT]
Timestamp: ${new Date().toISOString()}
User: ${req.user.email}
Role: ${req.user.role}
IP: ${req.ip}
Operation: CHECKOUT
Entity: Transaction
Entity ID: ${transaction.id}`);

    res.status(201).json(new ApiResponse(201, transaction, "Transaction completed successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single transaction by ID
 * @route GET /api/transactions/:id
 */
const getTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);
    res.status(200).json(new ApiResponse(200, transaction, "Transaction retrieved successfully"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  getTransaction,
};
