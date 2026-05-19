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
        const projects = await features.query.populate([
            { path: 'team', select: 'title' }
        ]);

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
    createProject,
    getAllProjects,
    // getProject,
    // updateTeam,
    // deleteTeam,
    // teamReactivate
};