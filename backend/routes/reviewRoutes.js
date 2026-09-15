const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/product/:productId", reviewController.getReviewsByProduct);
router.post("/", protect, authorize("customer"), reviewController.createReview);
router.put("/:id", protect, reviewController.updateReview);
router.delete("/:id", protect, reviewController.deleteReview);
router.post("/:id/restore", protect, reviewController.restoreReview);

module.exports = router;
