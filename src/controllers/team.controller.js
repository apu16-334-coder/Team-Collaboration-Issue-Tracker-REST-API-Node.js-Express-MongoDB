const Teams = require("../models/team.model.js")
const Users = require("../models/user.model.js")
const catchAsync = require('../utils/catchAsync.js')
const AppError = require("../utils/AppError.js");
const ApiFeatures = require("../utils/apiFeatures.js");

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * createTeam
 * Admin-only: create a new user
 * POST /api/v1/teams
 */
const createTeam = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if(!req.body) return next(new AppError(400, 'Not valid request body'));
        
        const filtered = filterBody(req.body, 'title', 'description', 'teamLead', 'isActive')

        if (filtered.teamLead) {
            if ((await Users.findById(teamLead).select('role')).role !== 'team_lead') {
                return next(new AppError(400, 'Only users with team_lead role can be assigned as team lead'))
            }
        }

        const team = await Teams.create(filtered);

        res.status(201).json({
            success: true,
            data: team
        })
    }
)

/**
 * GetAllTeams
 * Admin-only: get all the teams
 * GET /api/v1/teams
 */
const getAllTeams = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        const features = new ApiFeatures(Teams.find(), req.query)
            .filter()
            .search('title', 'description')
            .sort()
            .pagination()

        // execute query 
        const teams = await features.query;

        // count total without pagination
        const total = await Teams.countDocuments(features.getQueryObjForCount());

        // Send response meta-data for pagination
        res.status(200).json({
            success: true,
            results: teams.length,
            total,
            page: features.page,
            limit: features.limit,
            data: teams
        })
    }
)

/**
 * GetMyTeams
 * Team_lead only: get all the teams of logged team_lead
 * GET /api/v1/teams/my
 */
const getMyTeams = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        const features = new ApiFeatures(
            Teams.find({ teamLead: req.user.id }),
            req.query
        ).filter().search('title', 'description').sort().pagination();

        // execute query 
        const teams = await features.query;

        // count total without pagination
        const total = await Teams.countDocuments(features.getQueryObjForCount());

        // Send response meta-data for pagination
        res.status(200).json({
            success: true,
            results: teams.length,
            total,
            page: features.page,
            limit: features.limit,
            data: teams
        })

    }
)

/**
 * GetTeam
 * (admin | team_lead of team): get a particular team by id
 * GET /api/v1/teams/:id
 */
const getTeam = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find team
        const team = await Teams.findById(req.params.id);
        if (!team) return next(new AppError(404, 'Team is not found'));

        // if logged user is not admin
        if (req.user.role !== 'admin') {
            // then if team is not active
            if (!team.isActive) return next(new AppError(404, 'Team is not found'));
        }

        // if logged user is not team lead of the team
        if (req.user.role === 'team_lead' && team.teamLead.toString() !== req.user.id) {
            return next(new AppError(403, 'you can not access'));
        }

        // if logged user is not member of the team
        if (req.user.role === 'member' && !team.members.includes(req.user.id)) {
            return next(new AppError(403, 'you can not access'));
        }

        res.status(200).json({
            success: true,
            data: team
        })
    }
)

/**
 * UpdateTeam
 * admin only: update a particular team title/ description/ team_lead by id
 * PATCH /api/v1/teams/:id
 */
const updateTeam = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if(!req.body) return next(new AppError(400, 'Not valid request body'));

        const filtered = filterBody(req.body, 'title', 'description', 'teamLead');

        if(Object.keys(filtered).length === 0) return next(new AppError(400, "No valid fields to update"));

        if (filtered.teamLead) {
            if ((await Users.findById(teamLead).select('role')).role !== 'team_lead') {
                return next(new AppError(400, 'Only users with team_lead role can be assigned as team lead'))
            }
        }

        // Find team
        const team = await Teams.findById(req.params.id);
        if (!team) return next(new AppError(404, 'Team is not found'));
        if (!team.isActive) return next(new AppError(404, 'Team is not active'));

        const updatedTeam = await Teams.findByIdAndUpdate(
            req.params.id,
            filtered,
            { returnDocument: 'after', runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedTeam
        })
    }
)

/**
 * DeleteTeam
 * admin only: get a particular team by id
 * DELETE /api/v1/teams/:id
 */
const deleteTeam = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find Team
        const team = await Teams.findById(req.params.id)
        if (!team) return next(new AppError(404, 'Team is not found'));

        if (!team.isActive) return next(new AppError(400, 'Team is already deactive'));

        team.isActive = false;
        await team.save();

        res.status(204).send();
    }
)

/**
 * teamReactivate
 * admin only: get a particular team by id
 * DELETE /api/v1/teams/:id
 */
const teamReactivate = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find Team
        const team = await Teams.findById(req.params.id);
        if (!team) return next(new AppError(404, 'Team is not found'));

        if (team.isActive) return next(new AppError(400, 'Team is already active'));

        team.isActive = true;
        await team.save();

        res.status(200).json({
            success: true,
            data: team
        })
    }
)

/**
 * AddTeamMembers
 * admin only: Adding members in a particulat team by id
 * POST /api/v1/teams/:id/members
 */
const addTeamMembers = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        res.send("Adding members in a particulat team by id....")
    }
)

/**
 * GetTeamMembers
 * (admin, team_lead): Getting members in a particulat team by id
 * GET /api/v1/teams/:id/members
 */
const getTeamMembers = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {

        res.send("Getting members in a particulat team by id....")
    }
)

/**
 * DeleteTeamMember
 * (admin only): delete a member in a particulat team by id
 * DELETE /api/v1/teams/:id/members/:userId
 */
const deleteTeamMember = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {

        res.send("Getting members in a particulat team by id....")
    }
)

/**
 * GetTeamProjects
 * (admin | team_lead | team members) : Get all the projects of a particular team
 * GET /api/v1/teams/:id/projects
 */
const getTeamProjects = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {

        res.send("Getting members in a particulat team by id....")
    }
)

module.exports = {
    createTeam,
    getAllTeams,
    getMyTeams,
    getTeam,
    updateTeam,
    deleteTeam,
    teamReactivate,
    addTeamMembers,
    getTeamMembers,
    deleteTeamMember,
    getTeamProjects
};