const {
    createProject,
    getAllProjects,
    // getProject,
    // updateTeam,
    // deleteTeam,
    // teamReactivate
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



module.exports = router;