const express = require("express");
const router = express.Router();
const customerBehaviorController = require("../controllers/customerBehaviorController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(customerBehaviorController.getBehavior);

router.post("/view", customerBehaviorController.trackView);
router.post("/search", customerBehaviorController.trackSearch);
router.post("/click", customerBehaviorController.trackClick);

module.exports = router;
