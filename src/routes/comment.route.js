const express = require("express");
const router = express.Router({ mergeParams: true }) // ← key line

const { protect, restrictTo } = require("../middlewares/auth.middleware.js");

const {
    createComments,
    getIssueComments,
    
} = require("../controllers/comment.controller.js");

// ----------------------
// Comment Routes
// ----------------------

// Admin, team_lead, member: Create new comment
// Admin, team_lead, member: get all comments of a issue
// POST /api/v1/issues/:id/comments    →  create comments on a issue
// GET /api/v1/issues/:id/comments    →  get comments of a issue
router.route("/")
    .post(createComments)
    .get(getIssueComments)




module.exports = router;