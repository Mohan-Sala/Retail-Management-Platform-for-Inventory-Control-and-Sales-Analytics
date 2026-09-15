const express = require("express");
const router = express.Router();
const marketplaceController = require("../controllers/marketplaceController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("customer"));

router.get("/", marketplaceController.getProducts);
router.get("/:id", marketplaceController.getProductById);

module.exports = router;
