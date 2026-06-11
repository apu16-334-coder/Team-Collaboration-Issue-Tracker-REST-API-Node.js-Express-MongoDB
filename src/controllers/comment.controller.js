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
 * (team_lead, member): create a new comment
 * // POST /api/v1/issues/:id/comments
 */
const createComments = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const filtered = filterBody(req.body, 'text');

        // set author and issue
        filtered.author = req.user.id;
        filtered.issue = req.params.id;

        // find issue
        const issue = await Issues.findById(filtered.issue)
            .populate({
                path: 'project',
                select: 'title status',
                populate: {
                    path: 'team',
                    select: 'title teamLead members'
                }
            })

        if (!issue) return next(new AppError(404, 'issue is not found'));

        // If the project of the issue cancelled or archived 
        if (issue.project.status === 'cancelled' || issue.project.status === 'archived') return next(new AppError(404, 'issue is not found'));

        // then if issue is cancelled
        if (issue.status === 'cancelled') {
            const errArray = req.user.role === 'member'
                ? [404, 'issue is not found']
                : [400, `issue is ${issue.status}`];

            return next(new AppError(errArray[0], errArray[1]));
        }

        // if logged user is not team lead of this issue project team
        if (req.user.role === 'team_lead' && issue.project.team.teamLead.toString() !== req.user.id) {
            return next(new AppError(403, 'Team lead can only comments in his or her teams projects issues'));
        }

        // if logged user is not member of this issue project team
        if (req.user.role === 'member' && !issue.project.team.members.includes(req.user.id)) {
            return next(new AppError(403, 'member can only comments in his or her teams projects issues'));
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
        const issue = await Issues.findById(req.params.id)
            .populate({
                path: 'project',
                select: 'title status',
                populate: {
                    path: 'team',
                    select: 'title teamLead members'
                }
            })

        if (!issue) return next(new AppError(404, 'issue is not found'));

        // the if project of the issue is cancelled or archived
        if (issue.project.status === 'cancelled' || issue.project.status === 'archived') {
            // If logged user is not admin
            if (req.user.role !== 'admin') return next(new AppError(404, 'issue is not found'));
        }

        // then if issue is cancelled and logged user is member
        if (issue.status === 'cancelled' && req.user.role === 'member') return next(new AppError(404, 'issue is not found'));

        // if logged user is not team lead of this issue project team
        if (req.user.role === 'team_lead' && issue.project.team.teamLead.toString() !== req.user.id) {
            return next(new AppError(403, 'Team lead can only get comments of his teams projects issues'));
        }

        // if logged user is not member of this issue project team
        if (req.user.role === 'member' && !issue.project.team.members.includes(req.user.id)) {
            return next(new AppError(403, 'members can only get comments of his teams projects issues'));
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

/**
 * updateComment
 * author only : update a particular comment by id.
 * PATCH /api/v1/issues/:id/comments/:commentId
 */
const updateComment = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find comment
        const comment = await Comments.findById(req.params.commentId)
            .populate({
                path: 'issue',
                select: 'project status',
                populate: {
                    path: 'project',
                    select: 'status'
                }
            })

        if (!comment) return next(new AppError(404, 'comment is not found'));

        // If issue of the comment is cancelled
        if (comment.issue.status === 'cancelled') {
            const errAraay = req.user.role === "member"
                ? [404, 'comment is not found'] // if logged user is member
                : [400, 'Issue of the comment is cancelled']; // if not

            return next(new AppError(errAraay[0], errAraay[1]))
        }

        // If project of the issue of the comment is cancelled or archived
        if (comment.issue.project.status === 'cancelled' || comment.issue.project.status === 'archived') return next(new AppError(404, 'comment is not found'))

        // If logged user is not the author of the comment
        if (comment.author.toString() !== req.user.id) return next(new AppError(403, 'Only author of comment can edit'));

        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        if (!req.body.text) return next(new AppError(400, "No valid fields to update"));

        const updatedComment = await Comments.findByIdAndUpdate(
            req.params.commentId,
            { text: req.body.text, isEdited: true },
            { returnDocument: 'after', runValidators: true }
        ).populate([
            { path: 'issue', select: 'title' },
            { path: 'author', select: 'name email' }
        ]);

        res.status(200).json({
            success: true,
            data: updatedComment
        })
    }
)

/**
 * deleteComment
 * team_lead/ member as author: delete a comment
 * DELETE /api/v1/teams/:id
 */
const deleteComment = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find comment
        const comment = await Comments.findById(req.params.commentId)
            .populate({
                path: 'issue',
                select: 'project status',
                populate: {
                    path: 'project',
                    select: 'team status',
                    populate: {
                        path: 'team',
                        select: 'teamLead'
                    }
                }
            })

        if (!comment) return next(new AppError(404, 'comment is not found'));

        // If issue of the comment is cancelled
        if (comment.issue.status === 'cancelled') {
            const errAraay = req.user.role === "member"
                ? [404, 'comment is not found'] // if logged user is member
                : [400, 'Issue of the comment is cancelled']; // if not

            return next(new AppError(errAraay[0], errAraay[1]))
        }

        // If project of the issue of the comment is cancelled or archived
        if (comment.issue.project.status === 'cancelled' || comment.issue.project.status === 'archived') return next(new AppError(404, 'comment is not found'))

        // if logged user is not team lead of this comment issue project team
        if (req.user.role === 'team_lead' && comment.issue.project.team.teamLead.toString() !== req.user.id) return next(new AppError(403, 'Team lead can delete comment only of his or her teams projects issues'));

        // If logged user is member but not author  
        if (req.user.role === 'member' && comment.author.toString() !== req.user.id) return next(new AppError(403, 'member can only delete his or her comments'));

        await Comments.findByIdAndDelete(req.params.commentId);
        res.status(204).send();
    }
)

module.exports = {
    createComments,
    getIssueComments,
    updateComment,
    deleteComment,
};