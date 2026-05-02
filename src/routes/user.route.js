const router = require("express").Router();

const { createUser, getAllUsers } = require("../controllers/user.controller.js")
const { protect, restrictTo } = require("../middlewares/auth.middleware.js")


router.route('/')
    .post(protect, restrictTo('admin'), createUser)
    .get(protect, restrictTo('admin'), getAllUsers)




module.exports = router;