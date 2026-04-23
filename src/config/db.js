const mongoose = require("mongoose");

const connectDB = async function () {
    try {
        // Check for required environment variables
        // If DATABASE or DATABASE_PASSWORD is missing,
        if(!process.env.DATABASE || !process.env.DATABASE_PASSWORD) {
            throw new Error("Missing database environment variables");           
        }

        // Replace <password> placeholder in DATABASE string
        const DB = process.env.DATABASE.replace(
            '<password>',
            process.env.DATABASE_PASSWORD
        )

        // Connect to MongoDB using Mongoose
        await mongoose.connect(DB);

        // Log success (only for development/debugging)
        console.log("DB connected");


    } catch (error) {
        // Log the connection errors
        console.error('Mongoose connection error:', error);

        // Exit the process with failure code 1
        process.exit(1);
    }
} 

module.exports = connectDB;