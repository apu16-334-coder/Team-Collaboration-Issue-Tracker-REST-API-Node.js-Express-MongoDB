const express = require("express");

const { noRouteFound, globalErrorHandler } = require('./middlewares/error.middleware.js')

const app = express();

// Query parser extended
app.set('query parser', 'extended');

// Body parser: limit JSON size to 10kb to prevent large payload abuse
app.use(express.json({ limit: '10kb'}));

// Health route
app.get('/', (req, res) =>{
    res.status(200).json({
        success: true,
        message: 'API is running'
    })
})

/* ---------- ERROR HANDLERS ---------- */
app.use(noRouteFound)

app.use(globalErrorHandler)


module.exports = app;