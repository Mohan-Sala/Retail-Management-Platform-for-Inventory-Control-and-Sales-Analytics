const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(couponController.getCoupons)
  .post(authorize("admin", "vendor"), couponController.createCoupon);

router.post("/validate", authorize("customer"), couponController.validateCoupon);

module.exports = router;
