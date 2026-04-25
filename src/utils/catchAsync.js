/**
 * catchAsync
 * Wraps async route/controller functions to automatically
 * pass errors to Express's global error handler
 *
 * @param {Function} fn - Async function (req, res, next)
 * @returns {Function} Wrapped function with automatic error forwarding
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        // Call the async function and forward any errors to next()
        fn(req, res, next).catch(next);
    }
}

module.exports = catchAsync