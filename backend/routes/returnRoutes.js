const express = require("express");
const router = express.Router();
const returnController = require("../controllers/returnController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .post(authorize("customer"), returnController.createReturnRequest)
  .get(returnController.getReturnRequests);

router.put("/:id/approve", authorize("admin", "vendor"), returnController.approveReturnRequest);
router.put("/:id/reject", authorize("admin", "vendor"), returnController.rejectReturnRequest);
router.put("/:id/complete", authorize("admin", "vendor"), returnController.completeReturnRequest);

module.exports = router;
