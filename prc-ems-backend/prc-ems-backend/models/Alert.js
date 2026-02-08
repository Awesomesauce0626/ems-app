const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  reporterName: String,
  reporterPhone: String,
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  incidentType: {
    type: String,
    enum: [
      'cardiac_arrest',
      'respiratory_distress',
      'severe_bleeding',
      'trauma',
      'stroke',
      'allergic_reaction',
      'poisoning',
      'burn',
      'drowning',
      'other'
    ],
    required: true,
  },
  description: String,
  patientCount: {
    type: Number,
    default: 1,
  },
  medicalConditions: [String],
  age: Number,
  status: {
    type: String,
    enum: ['new', 'responding', 'en_route', 'on_scene', 'completed', 'cancelled'],
    default: 'new',
  },
  assignedEMS: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Alert', alertSchema);