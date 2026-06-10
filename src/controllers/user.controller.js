const Users = require('../models/user.model.js')
const Teams = require('../models/team.model.js')
const Projects = require('../models/project.model.js')
const Issues = require('../models/issue.model.js')
const catchAsync = require('../utils/catchAsync.js')
const AppError = require("../utils/AppError.js");
const ApiFeatures = require("../utils/apiFeatures.js");
const filterBody = require("../utils/filterBody.js")

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * createUser
 * Admin-only: create a new user
 * POST /api/v1/users
 */
const createUser = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        // Filtered unwanted fields
        const filtered = filterBody(req.body, 'name', 'email', 'password', 'role', 'isActive')

        // execute create user mongoose query
        const user = await Users.create(filtered);

        // send response with user data
        res.status(201).json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        })
    }
)

/**
 * getAllUsers
 * Admin-only: get all users with filtering, sorting, pagination, and search
 * GET /api/v1/users
 */
const getAllUsers = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Adding Api features(filter, search, sort, pagination) to query
        const features = new ApiFeatures(Users.find(), req.query)
            .filter()
            .search('name', 'email') // Search in name AND email fields
            .sort()
            .pagination()

        // execute query
        const users = await features.query;

        // Passed customQueryObj with filter and search features to count total 
        const total = await Users.countDocuments(features.customQueryObj);

        // Send response meta-data for pagination
        res.status(200).json({
            success: true,
            results: users.length,
            total,
            page: features.page,
            limit: features.limit,
            data: users
        })
    }
)

/**
 * getMe
 * Get current logged-in user
 * GET /api/v1/users/me
 */
const getMe = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // send response with user data
        res.status(200).json({
            success: true,
            data: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        })
    }
)

/**
 * updateMe
 * Update logged-in user's profile (name, email)
 * PATCH /api/v1/users/me
 */
const updateMe = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const filtered = filterBody(req.body, 'name', 'email');

        if (Object.keys(filtered).length === 0) return next(new AppError(400, "No valid fields to update"));

        const user = await Users.findByIdAndUpdate(
            req.user.id,
            filtered,
            { returnDocument: 'after', runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: user
        })
    }
)

/**
 * getUser
 * Admin, team_lead only the members of his teams: get a user by ID
 * GET /api/v1/users/:id
 */
const getUser = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Find user
        const user = await Users.findById(req.params.id)
        if (!user) return next(new AppError(404, "User is not found")); // if user not found

        // If logged user is a team leader
        if (req.user.role === 'team_lead') {
            // If specific user is not active
            if (!user.isActive) return next(new AppError(404, "User is not found"));

            // If specific user not a member of his or her teams
            if (!await Teams.exists({ teamLead: req.user.id, members: req.params.id })) return next(new AppError(403, 'Team Lead can only get his or her teams members'));
        }

        res.status(200).json({
            success: true,
            data: user
        });
    }
)

/**
 * updateUser
 * Admin-only: update a user by ID
 * PATCH /api/v1/users/:id
 */
const updateUser = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const filtered = filterBody(req.body, 'name', 'email');

        if (Object.keys(filtered).length === 0) return next(new AppError(400, "No valid fields to update"));

        // Prevent self update through this endpoint
        if (req.user.id === req.params.id) {
            return next(new AppError(403, "Admin cannot update his own profile here. Use /api/v1/users/me instead."));
        }

        // find user
        const user = await Users.findById(req.params.id)
        if (!user) return next(new AppError(404, 'User is not found'));
        if (!user.isActive) return next(new AppError(400, 'User is not active'));

        const updatedUser = await Users.findByIdAndUpdate(
            user.id,
            filtered,
            { returnDocument: 'after', runValidators: true }
        )

        res.status(200).json({
            success: true,
            data: updatedUser
        });
    }
)

/**
 * deleteUser
 * Admin-only: delete a user by ID
 * DELETE /api/v1/users/:id
 */
const deleteUser = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // Prevent self deactivate through this endpoint
        if (req.user.id === req.params.id) {
            return next(new AppError(403, "Admin cannot deactivate his own profile"));
        }

        // find user
        const user = await Users.findById(req.params.id);
        if (!user) return next(new AppError(404, 'User is not found'));
        if (!user.isActive) return next(new AppError(400, 'User is already deactivated'));

        // If target user is teamLead
        if (user.role === 'team_lead') {
            // set all of his team's teamlead null
            await Teams.updateMany(
                { teamLead: user.id},
                { teamLead: null }
            );
        }

        // If taget user is member
        if (user.role === 'member') {
            // find all teams he or she belongs
            const allTeams = await Teams.find({ members: user.id})
                .select('_id');

            const allTeamsIds = allTeams.map(p => p._id);

            // remove from all teams he or she belongs
            await Teams.updateMany(
                { _id: { $in: allTeamsIds } },
                { $pull: { members: user.id } }
            );

            // First find all running projects of his or her teams
            const runningProjects = await Projects.find({
                team: { $in: allTeamsIds },
                status: { $nin: ['cancelled', 'archived'] }
            }).select('_id')

            const runningProjectsIds = runningProjects.map(p => p._id)

            if (runningProjectsIds.length > 0) {
                // remove from any imcomplete issue he or she assigned
                await Issues.updateMany(
                    {
                        assignedTo: user.id,
                        status: { $nin: ['cancelled'] },
                        project: { $in: runningProjectsIds }
                    },
                    { assignedTo: null }
                )
            }
        }

        user.isActive = false;
        await user.save();
        res.status(204).send()
    }
)

/**
 * userReactivate
 * Admin-only: reactivate a user by id
 * PATCH /api/v1/users/:id/reactivate
 */

const userReactivate = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // find user
        const user = await Users.findById(req.params.id)
        if (!user) return next(new AppError(404, 'User is not found'));
        if (user.isActive) return next(new AppError(400, 'User is already activate'));

        user.isActive = true;
        await user.save();

        res.status(200).json({
            success: true,
            data: user
        })
    }
)

/**
 * changeUserRole
 * Admin-only: change user role
 * PATCH /api/v1/users/:id/change-role
 */
const changeUserRole = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const { role } = req.body

        if (!role) return next(new AppError(400, 'role is required'));

        // Prevent self-role change through this endpoint
        if (req.user.id === req.params.id) {
            return next(new AppError(400, 'Admin can not change his own role'));
        }

        // find user
        const user = await Users.findById(req.params.id)
        if (!user) return next(new AppError(404, 'User is not found'));
        if (!user.isActive) return next(new AppError(400, 'User is not active'));

        // If target user is teamLead
        if (user.role === 'team_lead' && role !== 'team_lead') {
            // set all of his team's teamlead null
            await Teams.updateMany(
                { teamLead: user.id },
                { teamLead: null }
            );
        }

        // If taget user is member
        if (user.role === 'member' && role !== 'member') {
            // find all teams he or she belongs
            const allTeams = await Teams.find({ members: user.id})
                .select('_id');

            const allTeamsIds = allTeams.map(p => p._id);

            console.log(allTeamsIds)

            // remove from all teams he or she belongs
            await Teams.updateMany(
                { _id: { $in: allTeamsIds } },
                { $pull: { members: user.id } }
            );

            // First find all running projects of his or her teams
            const runningProjects = await Projects.find({
                team: { $in: allTeamsIds },
                status: { $nin: ['cancelled', 'archived'] }
            }).select('_id')

            const runningProjectsIds = runningProjects.map(p => p._id)

            if (runningProjectsIds.length > 0) {
                // remove from any imcomplete issue he or she assigned
                await Issues.updateMany(
                    {
                        assignedTo: user.id,
                        status: { $nin: ['cancelled'] },
                        project: { $in: runningProjectsIds }
                    },
                    { assignedTo: null }
                )
            }
        }

        user.role = role;
        await user.save()

        res.status(200).json({
            success: true,
            data: user
        })
    }
)

/**
 * resetUserPassword
 * Admin-only: reset a user's password
 * PATCH /api/v1/users/:id/reset-password
 */
const resetUserPassword = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        // If request body is invalid
        if (!req.body) return next(new AppError(400, 'Not valid request body'));

        const { password } = req.body;

        if (!password) return next(new AppError(400, 'password is required'));

        // Prevent self-password reset through this endpoint
        if (req.user.id === req.params.id) {
            return next(new AppError(400, 'Admin can not reset his own password'));
        }

        // find user
        const user = await Users.findById(req.params.id)
        if (!user) return next(new AppError(404, 'User is not found'));
        if (!user.isActive) return next(new AppError(400, 'User is not active'));

        user.password = password; // plain password
        await user.save() // triggers pre("save") → hashing + passwordChangedAt

        res.status(200).json({
            success: true,
            message: "Password reset successful"
        })
    }
)

module.exports = {
    createUser,
    getAllUsers,
    getMe,
    updateMe,
    getUser,
    updateUser,
    deleteUser,
    userReactivate,
    changeUserRole,
    resetUserPassword
}