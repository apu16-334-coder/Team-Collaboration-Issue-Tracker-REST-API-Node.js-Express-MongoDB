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

/**
 * GetAllProjects
 * Admin-only: get all the projects
 * GET /api/v1/projects
 */
const getAllProjects = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        const features = new ApiFeatures(Projects.find(), req.query)
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

/**
 * getProject
 * (admin | team_lead of team): get a particular project by id
 * GET /api/v1/projects/:id
 */
const getProject = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find team
        const project = await Projects.findById(req.params.id)
            .populate('team', 'title teamLead members');

        if (!project) return next(new AppError(404, 'project is not found'));

        // if logged user is not admin
        if (req.user.role !== 'admin') {
            // then if project is archived
            if (project.status === 'archived') return next(new AppError(404, 'Project is not found'));
        }

        // if logged user is not team lead of the team of project
        if (req.user.role === 'team_lead' && project.team.teamLead.toString() !== req.user.id) {
            return next(new AppError(403, 'you can not access'));
        }

        // if logged user is not member of the team of project
        if (req.user.role === 'member' && !project.team.members.includes(req.user.id)) {
            return next(new AppError(403, 'you can not access'));
        }

        res.status(200).json({
            success: true,
            data: project
        })
    }
)



module.exports = {
    createProject,
    getAllProjects,
    getProject,
    // updateTeam,
    // deleteTeam,
    // teamReactivate
};