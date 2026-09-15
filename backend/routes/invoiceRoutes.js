const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/")
  .get(invoiceController.getInvoices);

router.route("/:id")
  .get(invoiceController.getInvoiceById);

router.route("/:id/download")
  .get(invoiceController.downloadInvoice);

module.exports = router;
