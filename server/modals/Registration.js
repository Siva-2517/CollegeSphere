const mongoose = require('mongoose')

const registrationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    registrationAt: {
        type: Date,
        default: Date.now
    },
    isTeamRegistration: {
        type: Boolean,
        default: false
    },
    teamName: {
        type: String,
        trim: true,
        validate: {
            validator: function (value) {
                // Team name is required only for team registrations
                if (this.isTeamRegistration) {
                    return value && value.length > 0;
                }
                return true;
            },
            message: 'Team name is required for team registrations'
        }
    },
    participants: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
        }
    }]
}, { timestamps: true });


registrationSchema.index({ user: 1, event: 1 }, { unique: true });
module.exports = mongoose.model('Registration', registrationSchema);