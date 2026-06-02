const express = require("express");
const router = express.Router({ mergeParams: true }) // ← key line

const { protect, restrictTo } = require("../middlewares/auth.middleware.js");

const {
    createComments,
    getIssueComments,
    updateComment,
    deleteComment,
    
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

// Author only: update a comment by it is id
// Author/ team_lead/ admin: delete a comment by it is id
// PATCH /api/v1/issues/:id/comments/:commentId    →  Update comment
// DELETE /api/v1/issues/:id/comments/:commentId    →  delete comment
router.route("/:commentId")
    .patch(updateComment)
    .delete(deleteComment)

module.exports = router;