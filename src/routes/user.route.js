const router = require("express").Router();

const { 
    createUser, 
    getAllUsers, 
    getMe, 
    updateMe, 
    getUser, 
    updateUser, 
    deleteUser
} = require("../controllers/user.controller.js")

const { protect, restrictTo } = require("../middlewares/auth.middleware.js")

// ----------------------
// User Routes
// ----------------------

// Admin-only: Create new user or get all users
// POST /api/v1/users      → create user
// GET  /api/v1/users      → get all users
router.route('/')
    .post(protect, restrictTo('admin'), createUser)
    .get(protect, restrictTo('admin'), getAllUsers)

// Logged-in user: Get or update own profile
// GET  /api/v1/users/me   → get current user profile
// PATCH /api/v1/users/me  → update own profile
router.route('/me')
    .get(protect, getMe)
    .patch(protect, restrictTo('admin', 'team_lead'), updateMe)

// Admin-only: Get/ update/ delete specific user by ID
// GET    /api/v1/users/:id   → get user by ID
// PATCH  /api/v1/users/:id   → update user by ID
// DELETE /api/v1/users/:id   → delete user by ID
router.route("/:id")
    .get(protect, restrictTo('admin', 'team_lead'), getUser)
    .patch(protect, restrictTo('admin'), updateUser)
    .delete(protect, restrictTo('admin'), deleteUser)



module.exports = router;