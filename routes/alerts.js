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
    } = req.body;

    if (!location || !location.lat || !location.lng) {
        return res.status(400).json({ message: 'Location data is invalid.' });
    }
    const formattedLocation = {
        latitude: location.lat,
        longitude: location.lng,
    };

    const userId = req.user && req.user.userId ? req.user.userId : null;

    const newAlert = new Alert({
      userId: userId,
      reporterName,
      reporterPhone,
      location: formattedLocation,
      incidentType,
      description,
      patientCount,
    });

    await newAlert.save();

    const populatedAlert = await Alert.findById(newAlert._id)
        .populate('userId', 'email firstName lastName')
        .populate('assignedEMS', 'email firstName lastName phoneNumber');

    req.io.emit('new-alert', populatedAlert);

    res.status(201).json({
      message: 'Alert created successfully',
      alert: populatedAlert,
    });
  } catch (error) {
    console.error("Alert Creation Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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
    const userRole = req.user.role;

    // --- SUPER-USER FIX: Check if user is authorized to update status ---
    if (userRole !== 'admin' && userRole !== 'ems_personnel') {
        return res.status(403).json({ message: 'You are not authorized to update alert statuses.' });
    }

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = status;
    alert.statusHistory.push({ status, note, userId: req.user.userId }); // Log which user made the change
    alert.updatedAt = new Date();

    // Automatically assign the user to the alert if it's unassigned and they are an EMS or Admin user
    if (!alert.assignedEMS && (userRole === 'ems_personnel' || userRole === 'admin')) {
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
