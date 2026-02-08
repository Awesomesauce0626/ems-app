const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const {
      reporterName,
      reporterPhone,
      location, // Optional map coordinates
      address,   // Required text address
      incidentType,
      description,
      patientCount,
    } = req.body;

    // --- DEPLOYMENT FIX: Make text address required ---
    if (!address) {
        return res.status(400).json({ message: 'Address / Location Description is required.' });
    }

    const formattedLocation = {
        latitude: location?.lat, // Use optional chaining
        longitude: location?.lng,
        address: address,
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

    if (userRole !== 'admin' && userRole !== 'ems_personnel') {
        return res.status(403).json({ message: 'You are not authorized to update alert statuses.' });
    }

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = status;
    alert.statusHistory.push({ status, note, userId: req.user.userId });
    alert.updatedAt = new Date();

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
