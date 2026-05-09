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
    .post(protect, restrictTo('admin'), createTeam)
    .get(protect, restrictTo('admin'), getAllTeams)

// Only team_lead: Team_lead get his teams
// GET /api.v1/teams/my → get teams of team_lead
router.get('/my', protect, restrictTo('team_lead'), getMyTeams);

// admin/ team_lead/ member: get a particular team by id;
// only admin: update or delete a team by id
// GET /api.v1/teams/:id → get a team
// PATCH /api.v1/teams/:id → update a team
// DELETE /api.v1/teams/:id → delete a team
router.route("/:id")
    .get(protect, restrictTo('admin', 'team_lead', 'member'), getTeam)
    .patch(protect, restrictTo('admin'), updateTeam)
    .delete(protect, restrictTo('admin'), deleteTeam)

// only admin: reassign a lead of team by id
// PATCH /api.v1/teams/:id/assign-lead → assign lead of a team
router.patch('/:id/assign-lead', protect, restrictTo('admin'), assignTeamLead)

// only admin: add or get members of a team by id
// POST /api.v1/teams/:id/members → add member of a team
// GET /api.v1/teams/:id/members → get members of a team
router.route("/:id/members")
    .post(protect, restrictTo('admin'), addTeamMembers)
    .get(protect, restrictTo('admin', 'team_lead'), getTeamMembers)

// only admin: remove member of a team
// DELETE /api.v1/teams/:id/members/:userId 
router.delete('/:id/members/:userId', protect, restrictTo('admin'), deleteTeamMember)

// admin/ team_lead/ member: get projects of a team
// DELETE /api.v1/teams/:id/projects
router.get('/:id/projects', protect, restrictTo('admin', 'team_lead', 'member'), getTeamProjects)



module.exports = router;