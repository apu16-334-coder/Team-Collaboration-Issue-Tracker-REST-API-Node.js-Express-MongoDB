const AppError = require('../utils/AppError.js') // Custom error class

// This catches routes that don't exist
const noRouteFound = (req, res, next) => {
    next(new AppError(404, `Route Not Found - ${req.url}`))
}

// Global error handler
// Catches all errors thrown in the app
const globalErrorHandler = (err, req, res, next) => {
    // Log stack trace (dev/debugging)
    console.error(err.stack);

    // Mongoose validation or cast errors
    if (err.name === "ValidationError") {
        err.status = 400;
    }

    // Mongoose cast errors
    if (err.name === "CastError") {
        err.status = 400;
        err.message = "Invalid Id: " + err.message.slice(err.message.search('value'))
    }

    // MongoDB duplicate key error (unique constraint)
    if (err.code === 11000) {
        if(err.keyValue.title && err.keyValue.team) {
            err = new AppError(400, `Project with this title already exists in this selected team`);
        }else {
            err = new AppError(400, `${Object.keys(err.keyValue)} is already exist`);
        }       
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error '
    })
}

module.exports = { noRouteFound, globalErrorHandler }
