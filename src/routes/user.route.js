const router = require("express").Router();

const { 
    createUser, 
    getAllUsers, 
    getMe, 
    updateMe 
} = require("../controllers/user.controller.js")

const { protect, restrictTo } = require("../middlewares/auth.middleware.js")

router.route('/')
    .post(protect, restrictTo('admin'), createUser)
    .get(protect, restrictTo('admin'), getAllUsers)

router.route('/me')
    .get(protect, getMe)
    .patch(protect, updateMe)

module.exports = router;