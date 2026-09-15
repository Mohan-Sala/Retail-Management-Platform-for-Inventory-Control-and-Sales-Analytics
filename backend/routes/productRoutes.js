const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateProduct } = require("../middleware/validators");

// Product CRUD endpoints
// GET /api/products - fetch all products (supports query parameters search, category, vendorId, etc. Scoped by user role)
router.get("/", protect, productController.getProducts);

// GET /api/products/:id - fetch single product by ID
router.get("/:id", protect, productController.getProduct);

// POST /api/products - create product (protected, Admin or Vendor)
router.post("/", protect, authorize("admin", "vendor"), validateProduct, productController.createProduct);

// PUT /api/products/:id - edit product details (protected, Admin or owner Vendor)
router.put("/:id", protect, authorize("admin", "vendor"), validateProduct, productController.updateProduct);

// DELETE /api/products/:id - remove product from database (protected, Admin or owner Vendor)
router.delete("/:id", protect, authorize("admin", "vendor"), productController.deleteProduct);

module.exports = router;
