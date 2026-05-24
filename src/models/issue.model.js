const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User Schema
const issueSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "title is required"],
        trim: true,
        minlength: [3, 'title must be at least 3 characters'],
        maxlength: [20, 'title must be at most 20 characters']
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'done', 'in_review', 'closed', 'cancelled'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    type: {
        type: String,
        enum: ['bug', 'feature', 'task', 'improvement'],
        default: 'task'
    },
    project: { 
        type: mongoose.Schema.ObjectId, 
        ref: 'Project', 
        required: true 
    },
    assignedTo: { 
        type: mongoose.Schema.ObjectId, 
        ref: 'User' 

    },
    createdBy: { 
        type: mongoose.Schema.ObjectId, 
        ref: 'User', required: true 
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

// Transform output for JSON / Object
// Remove _id and __v, add id string
const transform = (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
};

issueSchema.set("toJSON", { transform });
issueSchema.set("toObject", { transform });

const Issues = mongoose.model('Issue', issueSchema);

module.exports = Issues;