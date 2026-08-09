const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    membershipId: {
        type: String,
        required: true,
        trim: true,
    },
    bio: {
        type: String,
        trim: true,
        default: '',
    },
    photoUrl: {
        type: String,
        trim: true,
        default: '',
    },
});

const PositionSchema = new mongoose.Schema({
    positionName: {
        type: String,
        required: true,
        trim: true,
    },
    candidates: [CandidateSchema],
});

const PollSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    createdBy: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'closed'],
        default: 'draft',
    },
    positions: [PositionSchema],
    startTime: {
        type: Date,
    },
    endTime: {
        type: Date,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Poll', PollSchema);
