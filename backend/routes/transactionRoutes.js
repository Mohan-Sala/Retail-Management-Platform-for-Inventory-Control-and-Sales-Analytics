const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateTransaction } = require("../middleware/validators");

// GET /api/transactions - list transactions (supports query filters)
router.get("/", protect, transactionController.getTransactions);

// GET /api/transactions/:id - fetch single transaction by ID
router.get("/:id", protect, transactionController.getTransaction);

// POST /api/transactions - create transaction order (protected, Admin only)
router.post("/", protect, authorize("admin"), validateTransaction, transactionController.createTransaction);

module.exports = router;
