const express = require("express");
const router = express.Router();

const { signUp, logIn} = require("../controllers/auth.controller.js")

// ----------------------
// Auth Routes
// ----------------------

// Signup a new user
// POST /api/v1/auth/signup
router.post("/signup", signUp);

// Login existing user
// POST /api/v1/auth/login
router.post("/login", logIn);

module.exports = router;