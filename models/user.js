const mongoose = require('mongoose')

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  participants: {
    type: Array,
    required: true
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('meetings', meetingSchema)