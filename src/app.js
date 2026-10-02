const express = require("express");
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')

const { noRouteFound, globalErrorHandler } = require('./middlewares/error.middleware.js')
const authRouter = require('./routes/auth.route.js')
const userRouter = require('./routes/user.route.js')
const teamRouter = require('./routes/team.route.js')
const projectRouter = require('./routes/project.route.js')
const issueRouter = require('./routes/issue.route.js')
const { protect } = require("./middlewares/auth.middleware.js");

const app = express();

// Query parser extended
app.set('query parser', 'extended');

// cookie parser
app.use(cookieParser());

// Security middlewares
app.use(helmet())
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // frontend URL
    credentials: true // ← required for cookies
}))

// Body parser: limit JSON size to 10kb to prevent large payload abuse
app.use(express.json({ limit: '10kb' }));

// Rate Limiter: limit requests to 100 per IP per hour
const limiter = rateLimit({
    max: process.env.NODE_ENV === 'development' ? 1000 : 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again later."
})
app.use('/api', limiter)

// Health route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running'
    })
})

/* ---------- ROUTES ---------- */

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', protect, userRouter);
app.use('/api/v1/teams', protect, teamRouter);
app.use('/api/v1/projects', protect, projectRouter);
app.use('/api/v1/issues', protect, issueRouter);


/* ---------- ERROR HANDLERS ---------- */

app.use(noRouteFound)

app.use(globalErrorHandler)


module.exports = app;