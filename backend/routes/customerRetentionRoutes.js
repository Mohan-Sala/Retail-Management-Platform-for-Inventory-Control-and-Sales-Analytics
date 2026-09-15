const express = require("express");
const router = express.Router();
const customerRetentionController = require("../controllers/customerRetentionController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(customerRetentionController.getRetentionMetrics);

module.exports = router;
