const {
    createTeam,
    getAllTeams,
    getMyTeams,
    getTeam,
    updateTeam,
    deleteTeam,
    assignTeamLead,
    addTeamMembers,
    getTeamMembers,
    deleteTeamMember,
    getTeamProjects
} = require("../controllers/team.controller.js");

const { protect, restrictTo } = require("../middlewares/auth.middleware.js");

const router = require("express").Router();

// ----------------------
// User Routes
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

// admin/ team_lead: get a particular team by id;
// only admin: update or delete a team by id
// GET /api.v1/teams/:id → get a team
// PATCH /api.v1/teams/:id → update a team
// DELETE /api.v1/teams/:id → delete a team
router.route("/:id")
    .get(restrictTo('admin', 'team_lead'), getTeam)
    .patch(restrictTo('admin'), updateTeam)
    .delete(restrictTo('admin'), deleteTeam)

// only admin: reassign a lead of team by id
// PATCH /api.v1/teams/:id/assign-lead → assign lead of a team
router.patch('/:id/assign-lead', restrictTo('admin'), assignTeamLead)

// only admin: add or get members of a team by id
// POST /api.v1/teams/:id/members → add member of a team
// GET /api.v1/teams/:id/members → get members of a team
router.route("/:id/members")
    .post(restrictTo('admin'), addTeamMembers)
    .get(restrictTo('admin', 'team_lead'), getTeamMembers)

// only admin: remove member of a team
// DELETE /api.v1/teams/:id/members/:userId 
router.delete('/:id/members/:userId', restrictTo('admin'), deleteTeamMember)

// admin/ team_lead/ member: get projects of a team
// DELETE /api.v1/teams/:id/projects
router.get('/:id/projects', getTeamProjects)



module.exports = router;