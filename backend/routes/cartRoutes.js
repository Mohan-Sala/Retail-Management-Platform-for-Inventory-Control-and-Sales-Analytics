const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("customer"));

router.get("/", cartController.getCart);
router.post("/", cartController.addToCart);
router.put("/", cartController.updateCartQuantity);
router.delete("/:productId", cartController.removeFromCart);
router.delete("/", cartController.clearCart);

module.exports = router;
