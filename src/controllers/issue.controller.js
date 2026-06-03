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

        const filtered = filterBody(req.body, 'title', 'description', 'priority', 'type', 'project', 'assignedTo');

        // check if project is here
        if (filtered.project) {
            // Find project
            const project = await Projects.findById(filtered.project)
                .populate('team', 'title teamLead members');

            if (!project || project.status === 'archived' || project.status === 'cancelled') return next(new AppError(404, 'Project is not found'));

            // if logged user is team lead but not of selected project team
            if (req.user.role === 'team_lead' && project.team.teamLead?.toString() !== req.user.id) return next(new AppError(403, 'Team lead can create issue only for his project'));

            // if logged user is member but not of selected project team
            if (req.user.role === 'member' && !project.team.members?.includes(req.user.id)) {
                return next(new AppError(403, 'Member can create issue only for his project'));
            }

            // if assigned to is there
            if (filtered.assignedTo) {
                // if logged user is memebr and not assigned himself or herself
                if (req.user.role === 'member' && filtered.assignedTo.toString() !== req.user.id) return next(new AppError(400, 'Member can assigned issue only to himself or herself'));

                // Team lead can assign only the team member of selected project
                if (!project?.team.members.includes(filtered.assignedTo)) {
                    return next(new AppError(400, 'Only team member of selected project can assign for issue'));
                }
            }
        }

        filtered.createdBy = req.user.id;

        const issue = await Issues.create(filtered);

        res.status(201).json({
            success: true,
            data: issue
        })
    }
)

/**
 * getAllIssues
 * Admin-only: get all the issues
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
 * getIssue
 * (admin | team_lead of team | member): get a particular issue by id
 * GET /api/v1/projects/:id
 */
const getIssue = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find issue
        const issue = await Issues.findById(req.params.id)
            .populate([
                {
                    path: 'project', select: 'title status', populate: {
                        path: 'team',
                        select: 'title teamLead members'
                    }
                }
            ]);

        if (!issue) return next(new AppError(404, 'issue is not found'));

        // if logged user is not admin
        if (req.user.role !== 'admin') {
            // if project is cancelled or archived
            if (issue.project.status === 'archived' || issue.project.status === 'cancelled') return next(new AppError(404, 'issue is not found'));
        }

        // then if issue is cancelled and logged user is member
        if (issue.status === 'cancelled' && req.user.role === 'member') return next(new AppError(404, 'issue is not found'));

        // if logged user is not team lead of this issue project team
        if (req.user.role === 'team_lead' && issue.project.team.teamLead.toString() !== req.user.id) {
            return next(new AppError(403, 'Team lead can get his or her teams projects issues only'));
        }

        // if logged user is not assigned to this issue
        if (req.user.role === 'member' && !issue.project.team.members.includes()) {
            return next(new AppError(403, 'Member can get his or her teams projects issues only'));
        }

        res.status(200).json({
            success: true,
            data: issue
        })
    }
)

/**
 * updateIssue
 * (admin, team_lead, member) : update a particular issue by id.(assignedTo member can update status only)
 * PATCH /api/v1/teams/:id
 */
const updateIssue = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // define allowed fields
        let allowedFields = [];

        // if user is not member
        if (req.user.role !== 'member') {
            allowedFields = ['title', 'description', 'status', 'priority', 'type', 'project', 'assignedTo'];
        } else if (req.user.id === issue.createdBy.toString()) {
            allowedFields = ['title', 'description', 'status', 'priority', 'type', 'project'];
        } else if (req.user.id === issue.assignedTo.toString()) {
            allowedFields = ['status']
        }

        // Find issue
        const issue = await Issues.findById(req.params.id)
            .populate([
                {
                    path: 'project', select: 'title team status', populate: {
                        path: 'team',
                        select: 'title teamLead members'
                    }
                },
                { path: 'assignedTo', select: 'name email' }
            ]);

        if (!issue) return next(new AppError(404, 'issue is not found'));

        // If the project of the issue cancelled or archived 
        if (issue.project.status === 'cancelled' || issue.project.status === 'archived') {
            const errArray = req.user.role !== 'admin'
                ? [404, 'issue is not found']
                : [400, `Project of the issue is ${issue.project.status}`];

            return next(new AppError(errArray[0], errArray[1]));
        }

        // then if issue is cancelled
        if (issue.status === 'cancelled') {
            // if logged user is member
            if (req.user.role === 'member') return next(new AppError(404, 'issue is not found'));

            // if logged user is not member
            allowedFields = ['status']
        }

        // if logged user is not team lead of this issue project team
        if (req.user.role === 'team_lead' && issue.project.team.teamLead.toString() !== req.user.id) {
            return next(new AppError(403, 'Team lead can update only his or her teams projects issues'));
        }

        // if logged user is not assigned to this issue
        if (req.user.role === 'member' && issue.assignedTo.toString() !== req.user.id) {
            return next(new AppError(403, 'Member can update only the issues he or she is assigned'));
        }

        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        // filtered allowed fields which are available
        const filtered = filterBody(req.body, ...allowedFields)

        if (Object.keys(filtered).length === 0) return next(new AppError(400, "No valid fields to update"));

        // check if project is here
        if (filtered.project) {
            // Find project
            const project = await Projects.findById(filtered.project)
                .populate('team', 'title teamLead members');

            if (!project || project.status === 'archived' || project.status === 'cancelled') return next(new AppError(404, 'Project is not found'));

            // if logged user is team lead but not of selected project team
            if (req.user.role === 'team_lead' && project.team.teamLead?.toString() !== req.user.id) return next(new AppError(403, 'Team lead can add issue only to his projects'));

            // if logged user is member but not of selected project team
            if (req.user.role === 'member' && !project.team.members?.includes(req.user.id)) {
                return next(new AppError(403, 'Member can add issue only those projects he or she belongs'));
            }

            // if assigned to is there
            if (filtered.assignedTo) {
                // Team lead can assign only the team member of selected project
                if (!project?.team.members.includes(filtered.assignedTo)) {
                    return next(new AppError(400, 'Only team member of selected project can assign for issue'));
                }
            }
        }

        // if status is there 
        if (filtered.status) {
            const allowedStatus = req.user.role !== 'member'
                ? ['open', 'in_progress', 'done', 'in_review', 'closed']
                : ['open', 'in_progress', 'done'];
            // the if status is not allowed
            if (!allowedStatus.includes(filtered.status)) return next(new AppError(400, `${req.user.role} can only set status as ${allowedStatus.join(', ')}`))
        }

        const updatedIssue = await Issues.findByIdAndUpdate(
            req.params.id,
            filtered,
            { returnDocument: 'after', runValidators: true }
        ).populate([
            { path: 'project', select: 'title team' },
            { path: 'assignedTo', select: 'name email' }
        ]);

        res.status(200).json({
            success: true,
            data: updatedIssue
        })
    }
)

/**
 * deleteIssue
 * admin/ team_lead: delete a particular issue by id
 * DELETE /api/v1/issues/:id
 */
const deleteIssue = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find Team
        const issue = await Issues.findById(req.params.id)
            .populate(
                {
                    path: 'project', select: 'title team status', populate: {
                        path: 'team',
                        select: 'title teamLead'
                    }
                }
            );
        if (!issue) return next(new AppError(404, 'issue is not found'));

        // If the project of the issue cancelled or archived 
        if (issue.project.status === 'cancelled' || issue.project.status === 'archived') {
            const errArray = req.user.role !== 'admin'
                ? [404, 'issue is not found']
                : [400, `Project of the issue is ${issue.project.status}`];

            return next(new AppError(errArray[0], errArray[1]));
        }

        if (issue.status === 'cancelled') return next(new AppError(400, `issue is already cancelled`));

        // if logged user is not team lead of this issue project team
        if (req.user.role === 'team_lead' && issue.project.team.teamLead.toString() !== req.user.id) {
            return next(new AppError(403, 'Team lead can delete only his her teams projects issues'));
        }

        issue.status = 'cancelled';

        await issue.save();
        res.status(204).send();
    }
)

module.exports = {
    createIssue,
    getAllIssues,
    getIssue,
    updateIssue,
    deleteIssue,
};