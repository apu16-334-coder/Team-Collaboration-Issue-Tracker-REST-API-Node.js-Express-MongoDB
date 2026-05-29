const Teams = require("../models/team.model.js")
const Users = require("../models/user.model.js")
const Projects = require("../models/project.model.js")
const Issues = require("../models/issue.model.js")
const catchAsync = require('../utils/catchAsync.js')
const AppError = require("../utils/AppError.js");
const ApiFeatures = require("../utils/apiFeatures.js");
const filterBody = require("../utils/filterBody.js");
const mongoose = require('mongoose');

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * createIssue
 * (Admin, team_lead, member): create a new issue
 * POST /api/v1/issues
 */
const createIssue = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const filtered = filterBody(req.body, 'title', 'description', 'status', 'priority', 'type', 'project', 'assignedTo')

        let project;

        // check if project is here
        if (filtered.project) {
            // Find project
            project = await Projects.findById(filtered.project)
                .populate('team', 'title teamLead members');

            if (!project || project.status === 'archived' || project.status === 'cancelled') return next(new AppError(404, 'Project is not found'));

            // if logged user is team lead but not of selected project team
            if (req.user.role === 'team_lead' && project.team.teamLead?.toString() !== req.user.id) return next(new AppError(403, 'Team lead can create issue only for his project'));

            // if logged user is member but not of selected project team
            if (req.user.role === 'member' && !project.team.members?.includes(req.user.id)) {
                return next(new AppError(403, 'Member can create task or bug only for his project'));
            }

            // if assigned to is there
            if (filtered.assignedTo) {
                // if logged user is memebr and not assigned himself or herself
                if (req.user.role === 'member' && filtered.assignedTo.toString() !== req.user.id) return next(new AppError(400, 'Member can assigned issue only to him or her'));

                // Team lead can assign only the team member of selected project
                if (!project?.team.members.includes(filtered.assignedTo)) {
                    return next(new AppError(400, 'Only team member of selected project can assign for issue'));
                }
            }
        }

        const issue = await Issues.create(filtered);

        res.status(201).json({
            success: true,
            data: issue
        })
    }
)

/**
 * GetAllProjects
 * Admin-only: get all the projects
 * GET /api/v1/projects
 */
const getAllIssues = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        const features = new ApiFeatures(Issues.find(), req.query)
            .filter()
            .search('title', 'description')
            .sort()
            .pagination()

        // execute query 
        const issues = await features.query.populate([
            { path: 'project', select: 'title' },
            { path: 'assignedTo', select: 'name email' }
        ]);

        // count total without pagination
        const total = await Issues.countDocuments(features.getQueryObjForCount());

        // Send response meta-data for pagination
        res.status(200).json({
            success: true,
            results: issues.length,
            total,
            page: features.page,
            limit: features.limit,
            data: issues
        })
    }
)

/**
 * getProject
 * (admin | team_lead of team | member): get a particular project by id
 * GET /api/v1/projects/:id
 */
const getIssue = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find project
        const issue = await Issues.findById(req.params.id)
            .populate([
                { path: 'project', select: 'title', populate: {
                    path: 'team',
                    select: 'title teamLead members'
                }},
                { path: 'assignedTo', select: 'name email' }
            ]);

        if (!issue) return next(new AppError(404, 'issue is not found'));

        // then if issue is cancelled
        if (issue.status === 'cancelled') {
            const errArray = req.user.role === 'member'
                ? [404, 'issue is not found']
                : [400, `issue is ${issue.status}`];

            return next(new AppError(errArray[0], errArray[1]));
        }

        // if logged user is not team lead of this issue team
        if (req.user.role === 'team_lead' && issue.project.team.teamLead.toString() !== req.user.id) {
            return next(new AppError(403, 'you can not access'));
        }

        // if logged user is not member of this issue team
        if (req.user.role === 'member' && !issue.project.team.members.includes(req.user.id)) {
            return next(new AppError(403, 'you can not access'));
        }

        res.status(200).json({
            success: true,
            data: issue
        })
    }
)

module.exports = {
    createIssue,
    getAllIssues,
    getIssue,
};