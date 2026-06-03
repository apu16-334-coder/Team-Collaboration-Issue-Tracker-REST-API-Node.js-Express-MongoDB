const Teams = require("../models/team.model.js")
const Projects = require("../models/project.model.js")
const Users = require("../models/user.model.js")
const catchAsync = require('../utils/catchAsync.js')
const AppError = require("../utils/AppError.js");
const ApiFeatures = require("../utils/apiFeatures.js");
const filterBody = require("../utils/filterBody.js");
const mongoose = require('mongoose');

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * createTeam
 * Admin-only: create a new team
 * POST /api/v1/teams
 */
const createTeam = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const filtered = filterBody(req.body, 'title', 'description', 'teamLead', 'isActive')

        if (filtered.teamLead) {
            // Find teamLead user
            const lead = await Users.findById(filtered.teamLead).select('isActive role')
            if (!lead) return next(new AppError(404, 'Team_lead is not found'));
            if (lead.role !== 'team_lead') return (400, 'Only user with role team_lead can assign as a lead in a team');
            if (!lead.isActive) return next(new AppError(400, 'Team_lead is not active'));
        } else {
            return next(new AppError(400, 'teamLead is required'));
        }

        const team = await Teams.create(filtered);

        res.status(201).json({
            success: true,
            data: team
        })
    }
)

/**
 * getAllTeams
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
        const teams = await features.query.populate([
            { path: 'teamLead', select: 'name email' },
            { path: 'members', select: 'name email' }
        ]);

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
 * getMyTeams
 * Team_lead only: get all the teams of logged team_lead
 * GET /api/v1/teams/my
 */
const getMyTeams = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        const features = new ApiFeatures(
            Teams.find({ teamLead: req.user.id, isActive: true }),
            req.query
        ).filter().search('title', 'description').sort().pagination();

        // execute query 
        const teams = await features.query.populate([
            { path: 'teamLead', select: 'name' },
            { path: 'members', select: 'name email' }
        ]);

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
 * getTeam
 * (admin | team_lead of team | members of team): get a particular team by id
 * GET /api/v1/teams/:id
 */
const getTeam = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find team
        const team = await Teams.findById(req.params.id)
            .populate([
                { path: 'teamLead', select: 'name email' },
                { path: 'members', select: 'name email' }
            ]);

        if (!team) return next(new AppError(404, 'Team is not found'));
        if (!team.isActive && req.user.role !== 'admin') return next(new AppError(404, 'Team is not found'));

        // if logged user is not team lead of the team
        if (req.user.role === 'team_lead' && team.teamLead.id.toString() !== req.user.id) {
            return next(new AppError(403, 'TeamLead can get his or her teams only'));
        }

        // if logged user is not member of the team
        if (req.user.role === 'member' && !team.members.includes(req.user.id)) {
            return next(new AppError(403, 'member can get his or her teams only'));
        }

        res.status(200).json({
            success: true,
            data: team
        })
    }
)

/**
 * updateTeam
 * admin only: update a particular team title/ description/ team_lead by id
 * PATCH /api/v1/teams/:id
 */
const updateTeam = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const filtered = filterBody(req.body, 'title', 'description', 'teamLead');

        if (Object.keys(filtered).length === 0) return next(new AppError(400, "No valid fields to update"));

        if (filtered.teamLead) {
            // Find teamLead user
            const lead = await Users.findById(filtered.teamLead).select('isActive role')
            if (!lead) return next(new AppError(404, 'Team_lead is not found'));
            if (lead.role !== 'team_lead') return (400, 'Only user with role team_lead can assign as a lead in a team');
            if (!lead.isActive) return next(new AppError(400, 'Team_lead is not active'));
        }

        // Find team
        const team = await Teams.findById(req.params.id);
        if (!team) return next(new AppError(404, 'Team is not found'));
        if (!team.isActive) return next(new AppError(404, 'Team is not active'));

        const updatedTeam = await Teams.findByIdAndUpdate(
            req.params.id,
            filtered,
            { returnDocument: 'after', runValidators: true }
        ).populate([
            { path: 'teamLead', select: 'name email' },
            { path: 'members', select: 'name email' }
        ])

        res.status(200).json({
            success: true,
            data: updatedTeam
        })
    }
)

/**
 * deleteTeam
 * admin only: get a particular team by id
 * DELETE /api/v1/teams/:id (?force=true query supported)
 */
const deleteTeam = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find Team
        const team = await Teams.findById(req.params.id)
        if (!team) return next(new AppError(404, 'Team is not found'));

        if (!team.isActive) return next(new AppError(400, 'Team is already deactive'));

        // set status of all planning or active projects of this team to on_hold
        await Projects.updateMany(
            { team: team.id, status: { $in: ['planning', 'active' ] } },
            { status: 'on_hold' }
        )

        // set status of all completed projects of this team to archived
        await Projects.updateMany(
            { team: team.id, status: 'completed'},
            { status: 'archived' }
        )

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
 * addTeamMembers
 * admin only: Adding members in a particular team by id
 * POST /api/v1/teams/:id/members
 */
const addTeamMembers = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body has invalid input
        if (!req.body) return next(new AppError(400, 'Invaild request body'))

        // get members
        let { members } = req.body
        if (!members) return next(new AppError(400, 'members is required'))

        // if members is not array, set as an array.
        if (!Array.isArray(members)) members = [members];

        // check if members array is empty
        if (members.length === 0) return next(new AppError(400, 'members array cannot be empty'));

        let errors = [];

        // Invalid ObjectId format
        const invalidIds = members.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            errors.push(`Invalid ID format: [${invalidIds.join(', ')}]`);
        }

        const validIds = members.filter(id => mongoose.Types.ObjectId.isValid(id));

        // Find existing users
        const existingUsers = await Users.find(
            { _id: { $in: validIds }, isActive: true }
        ).select('id role');

        // get existing users id
        const existingIds = existingUsers.map(u => u.id);

        // get non-existing users id
        const nonExistingIds = validIds.filter(id => !existingIds.includes(id));
        if (nonExistingIds.length > 0) {
            errors.push(`Non-existing user Ids: [${nonExistingIds.join(', ')}]`);
        }

        // Wrong role
        const wrongRoleUsers = existingUsers.filter(u => u.role !== 'member');
        if (wrongRoleUsers.length > 0) {
            errors.push(`Users without member role(user must be member): [${wrongRoleUsers.map(u => u.id).join(', ')}]`);
        }

        // if atleast one error is occurred
        if (errors.length > 0) {
            return next(new AppError(400, errors.join(' | ')));
        }

        const team = await Teams.findOneAndUpdate(
            { _id: req.params.id, isActive: true },
            { $addToSet: { members: { $each: members } } },
            { returnDocument: 'after', runValidators: true }
        ).populate([
            { path: 'teamLead', select: 'name email' },
            { path: 'members', select: 'name email' }
        ])

        if (!team) return next(new AppError(404, 'Team is not found'));

        res.status(200).json({
            success: true,
            data: team
        })
    }
)

/**
 * removeTeamMember
 * (admin only): delete a member in a particulat team by id
 * DELETE /api/v1/teams/:id/members/:userId
 */
const removeTeamMember = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // find team
        const team = await Teams.findById(req.params.id);
        if (!team) return next(new AppError(404, 'Team is not found'));
        if (!team.isActive) return next(new AppError(404, 'Team is not active'));

        if (!team.members.includes(req.params.userId)) {
            return next(new AppError(404, 'User is not a member of this team'));
        }

        const updatedTeam = await Teams.findByIdAndUpdate(
            req.params.id,
            { $pull: { members: req.params.userId } },
            { returnDocument: 'after', runValidators: true }
        ).populate([
            { path: 'teamLead', select: 'name email' },
            { path: 'members', select: 'name email' }
        ])

        res.status(200).json({
            success: true,
            data: updatedTeam
        })
    }
)

/**
 * getTeamProjects
 * (admin | team_lead | team members) : Get all the projects of a particular team
 * GET /api/v1/teams/:id/projects
 */
const getTeamProjects = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find team
        const team = await Teams.findById(req.params.id)
            .populate([
                { path: 'teamLead', select: 'name email' },
                { path: 'members', select: 'name email' }
            ]);

        if (!team) return next(new AppError(404, 'Team is not found'));

        // If team is not active
        if (!team.isActive && req.user.role !== 'admin') return next(new AppError(404, 'Team is not found'));

        // if logged user is not team lead of the team
        if (req.user.role === 'team_lead' && team.teamLead.id.toString() !== req.user.id) {
            return next(new AppError(403, 'TeamLead can get his or her teams projects only'));
        }

        // if logged user is not member of the team
        if (req.user.role === 'member' && !team.members.includes(req.user.id)) {
            return next(new AppError(403, 'member can get his or her teams projects only'));
        }

        const queryConditionsObj = req.user.role === 'admin'
            ? { team: team.id }
            : { team: team.id, status: { $nin: ['cancelled', 'archived'] } };

        const features = new ApiFeatures(Projects.find(queryConditionsObj), req.query)
            .filter()
            .search('title', 'description')
            .sort()
            .pagination()

        // execute query 
        const projects = await features.query.populate('team', 'title');

        // count total without pagination
        const total = await Projects.countDocuments(features.getQueryObjForCount());

        // Send response meta-data for pagination
        res.status(200).json({
            success: true,
            results: projects.length,
            total,
            page: features.page,
            limit: features.limit,
            data: projects
        })
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
    removeTeamMember,
    getTeamProjects
};