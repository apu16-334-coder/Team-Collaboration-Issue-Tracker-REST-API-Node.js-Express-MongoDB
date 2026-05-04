const express = require("express");
const router = express.Router();

const { signUp, logIn, logOut, changePassword} = require("../controllers/auth.controller.js")
const { protect, restrictTo } = require("../middlewares/auth.middleware.js")

// ----------------------
// Auth Routes
// ----------------------

// Signup a new user
// POST /api/v1/auth/signup
router.post("/signup", signUp);

// Login existing user
// POST /api/v1/auth/login
router.post("/login", logIn);

// Logout existing user
// POST /api/v1/auth/logout
router.post("/logout", logOut);

// change password of existing user
// PATCH /api/v1/auth/change-password
router.patch("/change-password", protect, changePassword)

module.exports = router;