const router = require("express").Router();

const { protect, restrictTo } = require("../middlewares/auth.middleware.js");

const commentRouter = require('./comment.route.js') // ← import

// Mount comment router on issue router
router.use('/:id/comments', commentRouter) // ← this is the connection

const {
    createIssue,
    getAllIssues,
    getIssue,
    updateIssue,
    deleteIssue,
} = require("../controllers/issue.controller.js");

// ----------------------
// Issue Routes
// ----------------------

// team_lead, member: Create new issue
// Admin: get all projects
// POST /api/v1/issues      → create issue
// GET  /api/v1/issues     → get all issues
router.route("/")
    .post(restrictTo('team_lead', 'member'), createIssue) 
    .get(restrictTo('admin'), getAllIssues)

// admin/ team_lead/ member: get a particular issue by id;
// team_lead/ member: update a particular issue by id;
// team_lead only: delete a particular issue by id;
// GET /api/v1/issues/:id → get a project
// PATCH /api/v1/issues/:id → update a project
// DELETE /api/v1/issues/:id → delete a project
router.route("/:id")
    .get(getIssue)
    .patch(restrictTo('team_lead', 'member'), updateIssue)
    .delete(restrictTo('team_lead'), deleteIssue)

module.exports = router;