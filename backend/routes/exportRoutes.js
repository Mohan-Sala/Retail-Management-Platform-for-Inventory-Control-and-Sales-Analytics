const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, exportController.exportData);

module.exports = router;
