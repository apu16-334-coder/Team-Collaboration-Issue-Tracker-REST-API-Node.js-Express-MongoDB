const router = require("express").Router();

const { 
    createUser, 
    getAllUsers, 
    getMe, 
    updateMe,
    getUser,
    deleteUser
} = require("../controllers/user.controller.js")

const { protect, restrictTo } = require("../middlewares/auth.middleware.js")

router.route('/')
    .post(protect, restrictTo('admin'), createUser)
    .get(protect, restrictTo('admin'), getAllUsers)

router.route('/me')
    .get(protect, getMe)
    .patch(protect, restrictTo('admin', 'team_lead'), updateMe)

router.route("/:id")
    .get(protect, restrictTo('admin', 'team_lead'), getUser)
    .patch(protect, restrictTo('admin'), deleteUser)

module.exports = router;