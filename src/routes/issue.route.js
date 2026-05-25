const {
    createIssue,
    
} = require("../controllers/issue.controller.js");

const { protect, restrictTo } = require("../middlewares/auth.middleware.js");

const router = require("express").Router();

// ----------------------
// Issue Routes
// ----------------------

// Admin, team_lead, member: Create new issue
// Admin: get all projects
// POST /api/v1/issues      → create issue
// GET  /api/v1/issues     → get all issues
router.route("/")
    .post(createIssue)


module.exports = router;