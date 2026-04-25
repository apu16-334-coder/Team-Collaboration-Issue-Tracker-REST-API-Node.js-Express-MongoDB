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
    if(err.name === "ValidationError" || err.name === "CastError") {
        err.status = 400;
    }

    // MongoDB duplicate key error (unique constraint)
    if(err.code === 11000) {
        err = new AppError(400, `${Object.keys(err.keyValue)} is already exists`);
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error '
    })
}

module.exports = { noRouteFound, globalErrorHandler}
