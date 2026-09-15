const express = require("express");
const router = express.Router();
const supportController = require("../controllers/supportController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .post(authorize("customer"), supportController.createTicket)
  .get(supportController.getTickets);

router.post("/:id/reply", supportController.addReply);
router.put("/:id/assign", authorize("admin", "manager", "staff"), supportController.assignTicket);
router.put("/:id/close", authorize("admin", "vendor", "manager", "staff"), supportController.closeTicket);

module.exports = router;
