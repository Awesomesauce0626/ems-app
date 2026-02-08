const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const {
      reporterName,
      reporterPhone,
      location,
      incidentType,
      description,
      patientCount,
      medicalConditions,
      age,
    } = req.body;

    // --- FIX: Transform location data ---
    if (!location || !location.lat || !location.lng) {
        return res.status(400).json({ message: 'Location data is invalid.' });
    }
    const formattedLocation = {
        latitude: location.lat,
        longitude: location.lng,
        // address field is optional and can be added later if needed
    };

    // Safely determine the userId
    const userId = req.user && req.user.userId ? req.user.userId : null;

    const alert = new Alert({
      userId: userId,
      reporterName,
      reporterPhone,
      location: formattedLocation, // Use the corrected location object
      incidentType,
      description,
      patientCount,
      medicalConditions,
      age,
    });

    await alert.save();

    const populatedAlert = await Alert.findById(alert._id)
        .populate('userId', 'email firstName lastName')
        .populate('assignedEMS', 'email firstName lastName phoneNumber');

    req.io.emit('new-alert', populatedAlert);

    res.status(201).json({
      message: 'Alert created successfully',
      alert: populatedAlert,
    });
  } catch (error) {
    console.error("Alert Creation Error:", error); // For better logging
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ... (the rest of the file remains the same)

router.get('/', auth, async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('userId', 'email firstName lastName')
      .populate('assignedEMS', 'email firstName lastName phoneNumber')
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('userId', 'email firstName lastName')
      .populate('assignedEMS', 'email firstName lastName phoneNumber');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, note } = req.body;

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = status;
    alert.statusHistory.push({ status, note });
    alert.updatedAt = new Date();

    if (!alert.assignedEMS && req.user.role === 'ems_personnel') {
      alert.assignedEMS = req.user.userId;
    }

    await alert.save();

    const populatedAlert = await Alert.findById(alert._id)
        .populate('userId', 'email firstName lastName')
        .populate('assignedEMS', 'email firstName lastName phoneNumber');

    req.io.emit('alert-status-update', populatedAlert);

    res.json({
      message: 'Alert status updated',
      alert: populatedAlert,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
