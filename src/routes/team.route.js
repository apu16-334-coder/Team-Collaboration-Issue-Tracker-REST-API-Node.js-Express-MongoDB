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

router.route("/")
    .post(protect, restrictTo('admin'), createTeam)
    .get(protect, restrictTo('admin'), getAllTeams)

router.get('/my', protect, restrictTo('team_lead'), getMyTeams);

router.route("/:id")
    .get(protect, restrictTo('admin', 'team_lead', 'member'), getTeam)
    .patch(protect, restrictTo('admin'), updateTeam)
    .delete(protect, restrictTo('admin'), deleteTeam)

router.patch('/:id/assign-lead', protect, restrictTo('admin'), assignTeamLead)

router.route("/:id/members")
    .post(protect, restrictTo('admin'), addTeamMembers)
    .get(protect, restrictTo('admin', 'team_lead'), getTeamMembers)

router.delete('/:id/members/:userId', protect, restrictTo('admin'), deleteTeamMember)

router.get('/:id/projects', protect, restrictTo('admin', 'team_lead', 'member'), getTeamProjects)



module.exports = router;