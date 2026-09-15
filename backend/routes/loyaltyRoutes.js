const express = require("express");
const router = express.Router();
const loyaltyController = require("../controllers/loyaltyController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("customer"));

router.get("/", loyaltyController.getLoyaltyAccount);
router.get("/history", loyaltyController.getLoyaltyHistory);
router.post("/redeem", loyaltyController.redeemPoints);

module.exports = router;
