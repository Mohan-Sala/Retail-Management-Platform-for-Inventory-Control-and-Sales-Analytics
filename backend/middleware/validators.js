const { body, validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * @desc Generic request validation interceptor middleware
 */
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => `${err.path}: ${err.msg}`);
    return next(new ApiError(400, "Validation failed", errorMessages));
  }
  next();
};

/**
 * @desc Auth registration validator
 */
const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Must be a valid email address"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("role").isIn(["admin", "vendor", "customer"]).withMessage("Role must be either 'admin', 'vendor' or 'customer'"),
  body("businessName")
    .if(body("role").equals("vendor"))
    .trim()
    .notEmpty()
    .withMessage("Business name is required for vendor role"),
  body("phone")
    .if(body("role").equals("vendor"))
    .trim()
    .notEmpty()
    .withMessage("Phone number is required for vendor role"),
  validateResult,
];

/**
 * @desc Auth login validator
 */
const validateLogin = [
  body("email").trim().isEmail().withMessage("Must be a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  validateResult,
];

/**
 * @desc Vendor creation/updating validator
 */
const validateVendor = [
  body("businessName").trim().isLength({ min: 2 }).withMessage("Business name must be at least 2 characters"),
  body("ownerName").trim().isLength({ min: 2 }).withMessage("Owner name must be at least 2 characters"),
  body("email").trim().isEmail().withMessage("Must be a valid email address"),
  body("phone").trim().isLength({ min: 6 }).withMessage("Phone number must be at least 6 characters"),
  body("gst").trim().isLength({ min: 6 }).withMessage("GST number must be at least 6 characters"),
  body("address").trim().isLength({ min: 2 }).withMessage("Address must be at least 2 characters"),
  body("city").trim().isLength({ min: 2 }).withMessage("City must be at least 2 characters"),
  body("commission")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Commission must be a number between 0 and 100"),
  body("status")
    .optional()
    .isIn(["active", "pending", "suspended"])
    .withMessage("Status must be active, pending, or suspended"),
  validateResult,
];

/**
 * @desc Product creation/updating validator
 */
const validateProduct = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("sku").trim().notEmpty().withMessage("SKU is required"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("price").isFloat({ gt: 0 }).withMessage("Price must be greater than 0"),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a positive integer"),
  body("reorderLevel")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Reorder level must be a positive integer"),
  body("vendorId").isMongoId().withMessage("Must be a valid Vendor MongoDB ObjectId"),
  body("status")
    .optional()
    .isIn(["active", "draft", "out_of_stock"])
    .withMessage("Status must be active, draft, or out_of_stock"),
  body("image").optional().trim().isURL().withMessage("Product image must be a valid URL"),
  body("description").optional().trim(),
  validateResult,
];

/**
 * @desc Transaction creation validator
 */
const validateTransaction = [
  body("customerId").isMongoId().withMessage("Must be a valid Customer MongoDB ObjectId"),
  body("vendorId").isMongoId().withMessage("Must be a valid Vendor MongoDB ObjectId"),
  body("productId").isMongoId().withMessage("Must be a valid Product MongoDB ObjectId"),
  body("qty").isInt({ min: 1 }).withMessage("Quantity must be a positive integer of at least 1"),
  body("paymentMethod")
    .optional()
    .isIn(["card", "upi", "wallet", "bank"])
    .withMessage("Payment method must be card, upi, wallet, or bank"),
  body("status")
    .optional()
    .isIn(["paid", "pending", "refunded", "failed"])
    .withMessage("Status must be paid, pending, refunded, or failed"),
  validateResult,
];

/**
 * @desc Customer creation/updating validator
 */
const validateCustomer = [
  body("name").trim().notEmpty().withMessage("Customer name is required"),
  body("phone").trim().isLength({ min: 10 }).withMessage("Phone number must be at least 10 digits"),
  body("email").trim().isEmail().withMessage("Must be a valid email address"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("address").optional().trim(),
  body("totalOrders")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Total orders cannot be negative"),
  body("totalSpending")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total spending cannot be negative"),
  validateResult,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateVendor,
  validateProduct,
  validateTransaction,
  validateCustomer,
};
