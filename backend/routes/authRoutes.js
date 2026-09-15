const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { validateRegister, validateLogin } = require("../middleware/validators");

// @route POST /api/auth/register
router.post("/register", validateRegister, authController.register);

// @route POST /api/auth/login
router.post("/login", validateLogin, authController.login);

// @route GET /api/auth/me
router.get("/me", protect, authController.getProfile);

module.exports = router;
