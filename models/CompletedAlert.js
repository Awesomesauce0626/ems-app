// This model is for storing completed alerts for historical/analytical purposes.
// Its schema is a direct copy of the main Alert schema to ensure data integrity during archival.

const mongoose = require('mongoose');

// We use the same schema definition as the active alerts.
const completedAlertSchema = new mongoose.Schema({
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
  incidentType: String,
  description: String,
  patientCount: Number,
  status: String,
  assignedEMS: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
  }],
  createdAt: Date,
  updatedAt: Date,
  archivedAt: {
    type: Date,
    default: Date.now, // Add a timestamp for when the alert was archived
  },
});

// The collection will be named 'completed_alerts' in the database
module.exports = mongoose.model('CompletedAlert', completedAlertSchema);
