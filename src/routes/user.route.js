const router = require("express").Router();

const { getAllUsers } = require("../controllers/user.controller.js")
const { protect, restrictTo } = require("../middlewares/auth.middleware.js")


router.route('/')
    .get(protect, restrictTo('admin'), getAllUsers)


module.exports = router;