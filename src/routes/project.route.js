const {
    createProject,
    getAllProjects,
    getProject,
} = require("../controllers/project.controller.js");

const { protect, restrictTo } = require("../middlewares/auth.middleware.js");

const router = require("express").Router();

// ----------------------
// Project Routes
// ----------------------

// Admin, team_lead: Create new project
// Admin: get all projects
// POST /api/v1/projects      → create team
// GET  /api/v1/projects     → get all projects
router.route("/")
    .post(restrictTo('admin', 'team_lead'), createProject)
    .get(restrictTo('admin'), getAllProjects)

// admin/ team_lead/ member: get a particular project by id;
// (admin/ team_lead): team_lead can update only (titile, description, status)
// admin: delete a project by id
// GET /api.v1/projects/:id → get a project
// PATCH /api.v1/projects/:id → update a project
// DELETE /api.v1/projects/:id → delete a project
router.route("/:id")
    .get(getProject)
    

module.exports = router;