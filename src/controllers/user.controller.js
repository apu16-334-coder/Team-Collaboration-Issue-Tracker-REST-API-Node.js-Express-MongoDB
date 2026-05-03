const Users = require('../models/user.model.js')
const catchAsync = require('../utils/catchAsync.js')
const AppError = require("../utils/AppError.js");
const ApiFeatures = require("../utils/apiFeatures.js");

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
        const {
            name,
            description,
            email,
            password,
            role
        } = req.body;

        const user = await Users.create({
            name,
            description,
            email,
            password,
            role
        })

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
        const { name, email } = req.body;

        console.log(req.user.id)
        const user = await Users.findByIdAndUpdate(
            req.user.id,
            { name, email },
            { returnDocument: 'after', runValidators: true }
        ).select('name email role isActive');

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
        const user = await Users.findById(req.params.id)

        if (!user) {
            return next(new AppError(404, "User not found"));
        }

        if(req.user.role === 'team_lead' && !user.isActive) {
            return next(new AppError(404, "User not found"));
        } 

        res.status(200).json({
            success: true,
            data: user
        });
        // res.send("get a user by id....")

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
        const {
            name,
            email,
            password,
            role,
            isActive
        } = req.body

        const user = await Users.findByIdAndUpdate(
            req.params.id,
            { name, email, password, role, isActive },
            { returnDocument: 'after', runValidators: true }
        );

        if(!user) return next(new AppError(404, 'User not found'))

        
        res.status(200).json({
            success: true,
            data: user
        });
        // res.send("get a user by id....")

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
        const user = await Users.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { returnDocument: 'after', runValidators: true }
        );

        if (!user) {
            return next(new AppError(404, "User not found"));
        }

        res.status(204).send()
    }
)



module.exports = { 
    createUser, 
    getAllUsers, 
    getMe, 
    updateMe, 
    getUser, 
    updateUser, 
    deleteUser
}