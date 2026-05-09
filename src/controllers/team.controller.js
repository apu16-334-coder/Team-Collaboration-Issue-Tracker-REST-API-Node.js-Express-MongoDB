const Teams = require("../models/team.model.js")
const Users = require("../models/user.model.js")
const catchAsync = require('../utils/catchAsync.js')
const AppError = require("../utils/AppError.js");
const ApiFeatures = require("../utils/apiFeatures.js");

/**
 * @typedef {import('express').RequestHandler} RequestHandler
 */

/**
 * createTeam
 * Admin-only: create a new user
 * POST /api/v1/teams
 */
const createTeam = catchAsync(
    /** @type {RequestHandler} */
    async(req, res, next) => {
        const {title, description, teamLead, members, isActive} = req.body;

        if(teamLead) {

            if((await Users.findById(teamLead).select('role')).role !== 'team_lead') {
                return next(new AppError(400, 'Only users with team_lead role can be assigned as team lead'))
            }
        }

        const team = await Teams.create({title, description, teamLead, members, isActive});

        res.status(201).json({
            success: true,
            data: team
        })
    }
)



module.exports = {
    createTeam
};