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
      'vehicular_accident',
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
  imageUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ['new', 'responding', 'en_route', 'on_scene', 'completed', 'cancelled'],
    default: 'new',
  },
  assignedEMS: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // --- DEPLOYMENT FIX: Add userId to status history to log who made the change ---
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
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
