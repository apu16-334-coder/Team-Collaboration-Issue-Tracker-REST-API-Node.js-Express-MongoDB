const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User Schema
const commentSchema = new mongoose.Schema({
    issue: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'Issue', 
        required: true 
    },
    author: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User', 
        required: true 
    },
    text: { 
        type: String, 
        required: true,
        maxlength: 2000 
    },
    isEdited: { 
        type: Boolean, 
        default: false 
    },
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

commentSchema.set("toJSON", { transform });
commentSchema.set("toObject", { transform });

const Comments = mongoose.model('Comment', commentSchema);

module.exports = Comments;