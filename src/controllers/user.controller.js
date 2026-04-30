const Users = require('../models/user.model.js')
const catchAsync = require('../utils/catchAsync.js')
const AppError = require("../utils/AppError.js");

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

const getAllUsers = catchAsync(
    /** @type {RequestHandler} */
    async (req, res, next) => {
        const users = await Users.find();

        res.status(200).json({
            success: true,
            data: users
        })
    }
)

module.exports = { getAllUsers }