const Teams = require("../models/team.model.js")
const Users = require("../models/user.model.js")
const Projects = require("../models/project.model.js")
const Issues = require("../models/issue.model.js")
const Comments = require("../models/comment.model.js")
const catchAsync = require('../utils/catchAsync.js')
const AppError = require("../utils/AppError.js");
const ApiFeatures = require("../utils/apiFeatures.js");
const filterBody = require("../utils/filterBody.js");
const mongoose = require('mongoose');

/** 
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * createComments
 * (Admin, team_lead, member): create a new comment
 * POST /api/v1/comments
 */
const createComments = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const filtered = filterBody(req.body, 'text');

        filtered.author = req.user.id;

        filtered.issue = req.params.id;

        if (filtered.issue) {
            const issue = await Issues.findById(filtered.issue).populate(
                {
                    path: 'project', select: 'title', populate: {
                        path: 'team',
                        select: 'title teamLead members'
                    }
                }
            )

            if (!issue) return next(new AppError(404, 'issue is not found'));

            // then if issue is cancelled
            if (issue.status === 'cancelled') {
                const errArray = req.user.role === 'member'
                    ? [404, 'issue is not found']
                    : [400, `issue is ${issue.status}`];

                return next(new AppError(errArray[0], errArray[1]));
            }

            // if logged user is not team lead of this issue project team
            if (req.user.role === 'team_lead' && issue.project.team.teamLead.toString() !== req.user.id) {
                return next(new AppError(403, 'you can not create this'));
            }

            // if logged user is not member of this issue project team
            if (req.user.role === 'member' && !issue.project.team.members.includes(req.user.id) ) {
                return next(new AppError(403, 'you can not create this'));
            }
        }

        const comment = await Comments.create(filtered);

        res.status(201).json({
            success: true,
            data: comment
        })
    }
)

/**
 * getIssueComments
 * Admin-only: get all the comments of a Issue
 * GET /api/v1/issues/:id/comments
 */
const getIssueComments = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // find issue
        const issue = await Issues.findById(req.params.id).select('status');

        if(!issue) return next(new AppError(404, 'Issue is not found'));

        if(issue.status === 'cancelled') {
            const errArray = req.user.role === 'member' 
                ? [404, 'Issue is not found']
                : [400, `issue is ${issue.status}`];

            return next(new AppError(errArray[0], errArray[1]));
        }

        const features = new ApiFeatures(Comments.find({ issue: req.params.id }), req.query)
            .filter()
            .search('text')
            .sort()
            .pagination()

        // execute query 
        const comments = await features.query.populate([
            { path: 'issue', select: 'title' },
            { path: 'author', select: 'name email' }
        ]);

        // count total without pagination
        const total = await Comments.countDocuments(features.getQueryObjForCount());

        // Send response meta-data for pagination
        res.status(200).json({
            success: true,
            results: comments.length,
            total,
            page: features.page,
            limit: features.limit,
            data: comments
        })
    }
)

module.exports = {
    createComments,
    getIssueComments,
};