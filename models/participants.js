const mongoose = require('mongoose')

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  rsvp: {
    type: String,
    required: true,
    default:"not answered"
  }
})

module.exports = mongoose.model('participants', participantSchema);