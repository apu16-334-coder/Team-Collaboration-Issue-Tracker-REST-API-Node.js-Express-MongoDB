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
    async(req, res, next) => {
        const {title, description, teamLead, members, isActive} = req.body;

        if(teamLead) {

            if((await Users.findById(teamLead).select('role')).role !== 'team_lead') {
                return next(new AppError(400, 'Only users with team_lead role can be assigned as team lead'))
            }
        }

        const team = await Teams.create({title, description, teamLead, members, isActive});

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
    async(req, res, next) => {
        
        res.send("getting all the teams....")
    }
)

/**
 * GetMyTeams
 * Team_lead only: get all the teams of logged team_lead
 * GET /api/v1/teams/my
 */
const getMyTeams = catchAsync(
    /** @type {RequestHandler} */
    async(req, res, next) => {
        
        res.send("getting all of my teams....")
    }
)

/**
 * GetTeam
 * (admin | team_lead of team | members of team): get a particular team by id
 * GET /api/v1/teams/:id
 */
const getTeam = catchAsync(
    /** @type {RequestHandler} */
    async(req, res, next) => {
        
        res.send("getting a particular team by id....")
    }
)

/**
 * UpdateTeam
 * admin only: get a particular team by id
 * PATCH /api/v1/teams/:id
 */
const updateTeam = catchAsync(
    /** @type {RequestHandler} */
    async(req, res, next) => {
        
        res.send("updating a particular team by id....")
    }
)

/**
 * DeleteTeam
 * admin only: get a particular team by id
 * DELETE /api/v1/teams/:id
 */
const deleteTeam = catchAsync(
    /** @type {RequestHandler} */
    async(req, res, next) => {
        
        res.send("deleteing a particular team by id....")
    }
)

/**
 * AssignTeamLead
 * admin only: Assign a team_lead to a team by id
 * PATCH /api/v1/teams/:id/assign-lead
 */
const assignTeamLead = catchAsync(
    /** @type {RequestHandler} */
    async(req, res, next) => {
        
        res.send("Assigning a team_lead to a team by id....")
    }
)

/**
 * AddTeamMembers
 * admin only: Adding members in a particulat team by id
 * POST /api/v1/teams/:id/members
 */
const  addTeamMembers= catchAsync(
    /** @type {RequestHandler} */
    async(req, res, next) => {
        
        res.send("Adding members in a particulat team by id....")
    }
)

/**
 * GetTeamMembers
 * (admin, team_lead): Getting members in a particulat team by id
 * GET /api/v1/teams/:id/members
 */
const  getTeamMembers= catchAsync(
    /** @type {RequestHandler} */
    async(req, res, next) => {
        
        res.send("Getting members in a particulat team by id....")
    }
)

/**
 * DeleteTeamMember
 * (admin only): delete a member in a particulat team by id
 * DELETE /api/v1/teams/:id/members/:userId
 */
const  deleteTeamMember= catchAsync(
    /** @type {RequestHandler} */
    async(req, res, next) => {
        
        res.send("Getting members in a particulat team by id....")
    }
)

/**
 * GetTeamProjects
 * (admin | team_lead | team members) : Get all the projects of a particular team
 * GET /api/v1/teams/:id/projects
 */
const  getTeamProjects= catchAsync(
    /** @type {RequestHandler} */
    async(req, res, next) => {
        
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
    assignTeamLead,
    addTeamMembers,
    getTeamMembers,
    deleteTeamMember,
    getTeamProjects
};