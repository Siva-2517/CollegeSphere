const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    collegeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    poster: {
        type: String,
        default: null
    },
    eventType: {
        type: String,
        enum: ['solo', 'team'],
        required: true,
        default: 'solo'
    },
    minTeamSize: {
        type: Number,
        min: 2,
        max: 50,
        validate: {
            validator: function (value) {
                // Only validate if this is a team event
                if (this.eventType === 'team' && value) {
                    return this.maxTeamSize ? value <= this.maxTeamSize : true;
                }
                return true;
            },
            message: 'Minimum team size must be less than or equal to maximum team size'
        }
    },
    maxTeamSize: {
        type: Number,
        min: 2,
        max: 50,
        validate: {
            validator: function (value) {
                // Only validate if this is a team event
                if (this.eventType === 'team' && value) {
                    return this.minTeamSize ? value >= this.minTeamSize : true;
                }
                return true;
            },
            message: 'Maximum team size must be greater than or equal to minimum team size'
        }
    },
    isApproved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
