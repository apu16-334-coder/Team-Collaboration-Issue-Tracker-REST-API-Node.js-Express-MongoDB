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

        // check if team is here
        if (filtered.team) {
            // find team
            const team = await Teams.findById(filtered.team).select('teamLead isActive');
            if (!team) return next(new AppError(404, 'Team is not found'));

            // If team is not active
            if (!team.isActive) {
                // if logged user is admin
                const errAraay = req.user.role === 'admin'
                    ? [400, 'Team is not active']
                    : [404, 'Team is not found'];

                return next(new AppError(errAraay[0], errAraay[1]));
            }

            // if team_lead create project for other's team
            if (req.user.role === 'team_lead' && team.teamLead.toString() !== req.user.id) return next(new AppError(400, 'TeamLead can create project only for his teams'));
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
 * (admin | team_lead of team | member): get a particular project by id
 * GET /api/v1/projects/:id
 */
const getProject = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find project
        const project = await Projects.findById(req.params.id)
            .populate('team', 'title teamLead members');

        if (!project) return next(new AppError(404, 'project is not found'));

        // then if project is archived
        if (project.status === 'archived' || project.status === 'cancelled') {
            const errArray = req.user.role !== 'admin'
                ? [404, 'project is not found']
                : [400, `project is ${project.status}`];

            return next(new AppError(errArray[0], errArray[1]));
        }

        // if logged user is not team lead of this project team
        if (req.user.role === 'team_lead' && project.team.teamLead.toString() !== req.user.id) {
            return next(new AppError(403, 'you can not access'));
        }

        // if logged user is not member of this project team
        if (req.user.role === 'member' && !project.team.members.includes(req.user.id)) {
            return next(new AppError(403, 'you can not access'));
        }

        res.status(200).json({
            success: true,
            data: project
        })
    }
)

/**
 * updateProject
 * (admin, team_lead) : update a particular project by id.(team_lead can update title, description and status only)
 * PATCH /api/v1/teams/:id
 */
const updateProject = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const allowedFields = req.user.role === 'admin'
            ? ['title', 'description', 'status', 'dueDate']
            : ['title', 'description', 'status']

        const filtered = filterBody(req.body, ...allowedFields)

        console.log(filtered)

        if (Object.keys(filtered).length === 0) return next(new AppError(400, "No valid fields to update"));

        // if logged user is team_lead
        if (filtered.status) {
            const allowedStatus = ['planning', 'active', 'on_hold', 'completed']
            // the if status is not allowed
            if (!allowedStatus.includes(filtered.status)) return next(new AppError(400, `Team_lead of project's team can only set status as ${allowedStatus.join(', ')}`))
        }

        // Find team
        const project = await Projects.findById(req.params.id).populate('team', 'teamLead');
        if (!project) return next(new AppError(404, 'Project is not found'));

        // then if project is archived or cancelled
        if (project.status === 'archived' || project.status === 'cancelled') {
            const errArray = req.user.role !== 'admin'
                ? [404, 'project is not found']
                : [400, `project is ${project.status}`];

            return next(new AppError(errArray[0], errArray[1]));
        }

        // if logged user is not team lead of the team of project
        if (req.user.role === 'team_lead' && project.team.teamLead.toString() !== req.user.id) return next(new AppError(403, 'You can not update this project, only team_lead of this project can'));

        const updatedProject = await Projects.findByIdAndUpdate(
            req.params.id,
            filtered,
            { returnDocument: 'after', runValidators: true }
        ).populate('team', 'title')

        res.status(200).json({
            success: true,
            data: updatedProject
        })
    }
)

/**
 * DeleteTeam
 * admin only: get a particular team by id
 * DELETE /api/v1/teams/:id
 */
const deleteProject = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find Team
        const project = await Projects.findById(req.params.id)
        if (!project) return next(new AppError(404, 'project is not found'));

        if (project.status === 'archived' || project.status === 'cancelled') return next(new AppError(400, `project is already ${project.status}`));

        project.status = req.query.force
            ? "cancelled"
            : "archived"

        await project.save();
        res.status(204).send();
    }
)

module.exports = {
    createProject,
    getAllProjects,
    getProject,
    updateProject,
    deleteProject
};