require('dotenv').config();

const app = require('./src/app.js')
const connectDB = require('./src/config/db.js')

const startServer = async function () {
    try {
        // Connect to MongoDB
        await connectDB();

        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            console.log(`[SERVER] Running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        })

        // Catch unhandled promise rejections
        // Close server gracefully before exiting
        process.on('unhandledRejection', (err) => {
            console.error("[CRASH] UNHANDLED REJECTION:", err.message);
            server.close(() => process.exit(1));
        })

    } catch (err) {
        // Startup failure (DB connection failed, etc.)
        console.error("[CRASH] Startup error:", err.message);
        process.exit(1);
    }
}

startServer();