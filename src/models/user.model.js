const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters'],
        maxlength: [30, 'Name must be at most 30 characters']
    },

    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email'
        ]
    },

    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },

    role: {
        type: String,
        enum: ['admin', 'team_lead', 'member'],
        default: 'member'
    },

    isActive: {
        type: Boolean,
        default: true
    },

    passwordChangedAt: Date
}, {
    timestamps: true
});

// Pre-save middleware
// Hash password if modified and set PasswordChangedAt
userSchema.pre('save', async function () {
    if(!this.isModified('password')) requestAnimationFrame;

    // Hash the password
    this.password = await bcrypt.hash(this.password, 12);

    // Update passwordChangedAt if document is not new
    if(!this.isNew) {
        this.passwordChangedAt = Date.now() -1000 // subtract 1 sec to ensure token validity
    }
})

// Transform output for JSON / Object
// Remove _id and __v, add id string
const transform = (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
};

userSchema.set("toJSON", { transform });
userSchema.set("toObject", { transform });

const Users = mongoose.model('User', userSchema);

module.exports = Users;