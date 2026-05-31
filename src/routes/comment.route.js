const express = require("express");
const router = express.Router({ mergeParams: true }) // ← key line

const { protect, restrictTo } = require("../middlewares/auth.middleware.js");

const {
    createComments,
    
} = require("../controllers/comment.controller.js");

// ----------------------
// Comment Routes
// ----------------------

// Admin, team_lead, member: Create new comment
// POST /api/v1/issues/:id/comments    →  create comments on a issue
router.route("/")
    .post(createComments)




module.exports = router;