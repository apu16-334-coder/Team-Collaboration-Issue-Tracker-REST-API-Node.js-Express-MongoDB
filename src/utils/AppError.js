/**
 * AppError
 * Custom error class for Express.js applications
 * Extends the built-in Error class to include:
 * - status: HTTP status code
 * - isOperational: flag to distinguish expected errors from programming errors
 */
class AppError extends Error {
    /**
     * @param {number} status - HTTP status code (e.g., 400, 404, 500)
     * @param {string} message - Error message to return to client
     */
    constructor(status, message) {
        super(message); // Call parent Error constructor
        this.status = status;
        this.isOperational = true; // Marks expected, operational errors

        // Captures stack trace for debugging (shows where error originated)
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;