const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: function () {
                return !this.googleId;
            },
            minlength: 8
        },
        googleId: {
            type: String,
            default: null
        },
        avatar: {
            type: String,
            default: ''
        },
        role: {
            type: String,
            enum: ['student', 'admin', 'organizer'],
            default: 'student'
        },
        isApproved: {
            type: Boolean,
            default: false
        },
        isProfileComplete: {
            type: Boolean,
            default: true
        },
        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'College',
            default: null
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

module.exports = mongoose.model('User', userSchema)