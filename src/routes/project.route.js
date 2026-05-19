const {
    createProject,
    getAllProjects,
    getProject,
    updateTeam,
    deleteTeam,
    teamReactivate
} = require("../controllers/project.controller.js");

const { protect, restrictTo } = require("../middlewares/auth.middleware.js");

const router = require("express").Router();

// // ----------------------
// // Project Routes
// // ----------------------

// // Admin, team_lead: Create new project
// // Admin: get all projects
// // POST /api/v1/projects      → create team
// // GET  /api/v1/projects     → get all projects
// router.route("/")
//     .post(restrictTo('admin', 'team_lead'), createProject)
//     .get(restrictTo('admin'), getAllProjects)

// // admin/ team_lead/ member: get a particular project by id;
// // only admin: update or delete a team by id
// // GET /api.v1/projects/:id → get a team
// // PATCH /api.v1/teams/:id → update a team
// // DELETE /api.v1/teams/:id → delete a team
// router.route("/:id")
//     .get(getProject)
//     .patch(restrictTo('admin'), updateTeam)
//     .delete(restrictTo('admin'), deleteTeam)

// // only admin: reactivate a team by id
// // PATCH /api.v1/teams/:id/reactivate → reactivate a team
// router.patch('/:id/reactivate', restrictTo('admin'), teamReactivate)

module.exports = router;