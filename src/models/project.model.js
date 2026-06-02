const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User Schema
const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "title is required"],
        trim: true,
        minlength: [3, 'title must be at least 3 characters'],
        maxlength: [50, 'title must be at most 50 characters']
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled', 'archived'],
        default: 'planning',
        index: true
    },
    team: {
        type: mongoose.Schema.ObjectId, 
        ref: 'Team', 
        required: [true, 'Team is required'],
        index: true
    },
    dueDate: {
        type: Date,
        validate: {
            validator: function (val) {
                // Due date must be in the future (if provided)
                return !val || val >= Date.now()
            },
            message: 'Due date must be in the future'
        }
    }
}, {
    timestamps: true
});

// Unique compound index for title and team
projectSchema.index({ title: 1, team: 1 }, { unique: true });

// compund index for team and status
projectSchema.index({ team: 1, status: 1 });

// Transform output for JSON / Object
// Remove _id and __v, add id string
const transform = (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
};

projectSchema.set("toJSON", { transform });
projectSchema.set("toObject", { transform });

const Projects = mongoose.model('Project', projectSchema);

module.exports = Projects;