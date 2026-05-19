const {
    createTeam,
    getAllTeams,
    getMyTeams,
    getTeam,
    updateTeam,
    deleteTeam,
    teamReactivate,
    addTeamMembers,
    removeTeamMember,
    getTeamProjects
} = require("../controllers/team.controller.js");

const { protect, restrictTo } = require("../middlewares/auth.middleware.js");

const router = require("express").Router();

// ----------------------
// Team Routes
// ----------------------

// Admin-only: Create new team or get all teams
// POST /api/v1/teams      → create team
// GET  /api/v1/teams      → get all teams
router.route("/")
    .post(restrictTo('admin'), createTeam)
    .get(restrictTo('admin'), getAllTeams)

// Only team_lead: Team_lead get his teams
// GET /api.v1/teams/my → get teams of team_lead
router.get('/my', restrictTo('team_lead'), getMyTeams);

// admin/ team_lead/ member: get a particular team by id;
// only admin: update or delete a team by id
// GET /api.v1/teams/:id → get a team
// PATCH /api.v1/teams/:id → update a team
// DELETE /api.v1/teams/:id → delete a team
router.route("/:id")
    .get(getTeam)
    .patch(restrictTo('admin'), updateTeam)
    .delete(restrictTo('admin'), deleteTeam)

// only admin: reactivate a team by id
// PATCH /api.v1/teams/:id/reactivate → reactivate a team
router.patch('/:id/reactivate', restrictTo('admin'), teamReactivate)

// only admin: add or get members of a team by id
// POST /api.v1/teams/:id/members → add member of a team
// GET /api.v1/teams/:id/members → get members of a team
router.post("/:id/members", restrictTo('admin'), addTeamMembers)

// only admin: remove member of a team
// DELETE /api.v1/teams/:id/members/:userId 
router.delete('/:id/members/:userId', restrictTo('admin'), removeTeamMember)

// admin/ team_lead/ member: get projects of a team
// DELETE /api.v1/teams/:id/projects
router.get('/:id/projects', getTeamProjects)

module.exports = router;