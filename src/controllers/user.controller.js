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

module.exports = { createUser, getAllUsers }