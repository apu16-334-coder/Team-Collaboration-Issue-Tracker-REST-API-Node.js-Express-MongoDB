const Teams = require("../models/team.model.js")
const Users = require("../models/user.model.js")
const Projects = require("../models/project.model.js")
const catchAsync = require('../utils/catchAsync.js')
const AppError = require("../utils/AppError.js");
const ApiFeatures = require("../utils/apiFeatures.js");
const filterBody = require("../utils/filterBody.js");
const mongoose = require('mongoose');

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * createProject
 * (Admin, team_lead): create a new prject
 * POST /api/v1/projects
 */
const createProject = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const filtered = filterBody(req.body, 'title', 'description', 'status', 'team', 'dueDate')

        // check team is here
        if (filtered.team) {
            // find team
            const team = await Teams.findById(filtered.team).select('isActive');
            if (!team || !team.isActive) {
                return next(new AppError(404, 'Team is not found'));
            }
        }

        const project = await Projects.create(filtered);

        res.status(201).json({
            success: true,
            data: project
        })
    }
)

// /**
//  * GetAllProjects
//  * Admin-only: get all the projects
//  * GET /api/v1/projects
//  */
// const getAllProjects = catchAsync(
//     /** @type {RequestHandler} */
//     async (req, res, next) => {
//         const features = new ApiFeatures(Projects.find(), req.query)
//             .filter()
//             .search('title', 'description')
//             .sort()
//             .pagination()

//         // execute query 
//         const projects = await features.query.populate([
//             { path: 'team', select: 'title' }
//         ]);

//         // count total without pagination
//         const total = await Projects.countDocuments(features.getQueryObjForCount());

//         // Send response meta-data for pagination
//         res.status(200).json({
//             success: true,
//             results: projects.length,
//             total,
//             page: features.page,
//             limit: features.limit,
//             data: projects
//         })
//     }
// )

// /**
//  * GetTeam
//  * (admin | team_lead of team): get a particular team by id
//  * GET /api/v1/teams/:id
//  */
// const getProject = catchAsync(
//     /** @type {RequestHandler} */
//     async (req, res, next) => {
//         // Find team
//         const team = await Teams.findById(req.params.id)
//             .populate([
//                 { path: 'teamLead', select: 'name email' },
//                 { path: 'members', select: 'name email' }
//             ]);

//         if (!team) return next(new AppError(404, 'Team is not found'));

//         // if logged user is not admin
//         if (req.user.role !== 'admin') {
//             // then if team is not active
//             if (!team.isActive) return next(new AppError(404, 'Team is not found'));
//         }

//         // if logged user is not team lead of the team
//         if (req.user.role === 'team_lead' && team.teamLead.id.toString() !== req.user.id) {
//             return next(new AppError(403, 'you can not access'));
//         }

//         // if logged user is not member of the team
//         if (req.user.role === 'member' && !team.members.includes(req.user.id)) {
//             return next(new AppError(403, 'you can not access'));
//         }

//         res.status(200).json({
//             success: true,
//             data: team
//         })
//     }
// )

// /**
//  * UpdateTeam
//  * admin only: update a particular team title/ description/ team_lead by id
//  * PATCH /api/v1/teams/:id
//  */
// const updateTeam = catchAsync(
//     /** @type {RequestHandler} */
//     async (req, res, next) => {
//         // If request body is invalid
//         if (!req.body) return next(new AppError(400, 'Not valid request body'));

//         const filtered = filterBody(req.body, 'title', 'description', 'teamLead');

//         if (Object.keys(filtered).length === 0) return next(new AppError(400, "No valid fields to update"));

//         if (filtered.teamLead) {
//             if ((await Users.findById(teamLead).select('role')).role !== 'team_lead') {
//                 return next(new AppError(400, 'Only users with team_lead role can be assigned as team lead'))
//             }
//         }

//         // Find team
//         const team = await Teams.findById(req.params.id);
//         if (!team) return next(new AppError(404, 'Team is not found'));
//         if (!team.isActive) return next(new AppError(404, 'Team is not active'));

//         const updatedTeam = await Teams.findByIdAndUpdate(
//             req.params.id,
//             filtered,
//             { returnDocument: 'after', runValidators: true }
//         ).populate([
//             { path: 'teamLead', select: 'name email' },
//             { path: 'members', select: 'name email' }
//         ])

//         res.status(200).json({
//             success: true,
//             data: updatedTeam
//         })
//     }
// )

// /**
//  * DeleteTeam
//  * admin only: get a particular team by id
//  * DELETE /api/v1/teams/:id
//  */
// const deleteTeam = catchAsync(
//     /** @type {RequestHandler} */
//     async (req, res, next) => {
//         // Find Team
//         const team = await Teams.findById(req.params.id)
//         if (!team) return next(new AppError(404, 'Team is not found'));

//         if (!team.isActive) return next(new AppError(400, 'Team is already deactive'));

//         team.isActive = false;
//         await team.save();

//         res.status(204).send();
//     }
// )

// /**
//  * teamReactivate
//  * admin only: get a particular team by id
//  * DELETE /api/v1/teams/:id
//  */
// const teamReactivate = catchAsync(
//     /** @type {RequestHandler} */
//     async (req, res, next) => {
//         // Find Team
//         const team = await Teams.findById(req.params.id);
//         if (!team) return next(new AppError(404, 'Team is not found'));

//         if (team.isActive) return next(new AppError(400, 'Team is already active'));

//         team.isActive = true;
//         await team.save();

//         res.status(200).json({
//             success: true,
//             data: team
//         })
//     }
// )

module.exports = {
    createProject,
    // getAllProjects,
    // getProject,
    // updateTeam,
    // deleteTeam,
    // teamReactivate
};