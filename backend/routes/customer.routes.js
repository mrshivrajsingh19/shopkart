const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  logout,
  changePassword,
} = require("../controllers/customer.controller");
const authenticate = require("../middlewares/auth.middleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", authenticate, getProfile);
router.post("/logout", authenticate, logout);
router.patch("/change-password", authenticate, changePassword);

module.exports = router;
