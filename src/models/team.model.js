const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "title is required"],
        trim: true,
        minlength: [3, 'title must be at least 3 characters'],
        maxlength: [20, 'title must be at most 20 characters'],
        unique: true
    },
    description: {
        type: String,
        trim: true,
    },
    teamLead: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },  // single lead
    members: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    }], // excludes lead
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

}, {
    timestamps: true
});

// Compound indexes of teamLead and member
teamSchema.index({ teamLead: 1, members: 1 });

// Transform output for JSON / Object
// Remove _id and __v, add id string
const transform = (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
};

teamSchema.set("toJSON", { transform });
teamSchema.set("toObject", { transform });

const Teams = mongoose.model('Team', teamSchema);

module.exports = Teams;