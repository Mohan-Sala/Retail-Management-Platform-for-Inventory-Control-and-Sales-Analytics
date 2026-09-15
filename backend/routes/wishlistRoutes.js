const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("customer"));

router.get("/", wishlistController.getWishlist);
router.post("/", wishlistController.addToWishlist);
router.delete("/:productId", wishlistController.removeFromWishlist);
router.post("/move-to-cart", wishlistController.moveToCart);
router.delete("/", wishlistController.clearWishlist);

module.exports = router;
