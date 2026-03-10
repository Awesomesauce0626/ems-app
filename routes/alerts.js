const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const User = require('../models/User');
const CompletedAlert = require('../models/CompletedAlert');
const auth = require('../middleware/auth');
const admin = require('firebase-admin');

router.post('/', auth, async (req, res) => {
  try {
    const {
      reporterName,
      reporterPhone,
      location,
      address,
      incidentType,
      description,
      patientCount,
      imageUrl,
    } = req.body;

    const finalAddress = address || (location ? `Lat: ${location.lat}, Lng: ${location.lng}` : "Location not provided");

    const formattedLocation = {
        latitude: location?.lat || 0,
        longitude: location?.lng || 0,
        address: finalAddress,
    };

    const userId = req.user && req.user.userId ? req.user.userId : null;

    const newAlert = new Alert({
      userId: userId,
      reporterName: reporterName || "Anonymous",
      reporterPhone: reporterPhone || "N/A",
      location: formattedLocation,
      incidentType: incidentType || "other",
      description: description || "",
      patientCount: parseInt(patientCount) || 1,
      imageUrl: imageUrl || null,
    });

    await newAlert.save();

    const populatedAlert = await Alert.findById(newAlert._id)
        .populate('userId', 'email firstName lastName')
        .populate('assignedEMS', 'email firstName lastName phoneNumber');

    req.io.emit('new-alert', populatedAlert);

    const staffUsers = await User.find({
        role: { $in: ['ems_personnel', 'admin'] },
        isOnDuty: true
    });

    const tokens = staffUsers.flatMap(user => Array.isArray(user.fcmTokens) ? user.fcmTokens : []);

    if (tokens.length > 0) {
        const message = {
            notification: {
                title: 'New Emergency Alert!',
                body: `Incident: ${populatedAlert.incidentType} at ${finalAddress}`,
            },
            tokens: tokens,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'ems_alerts_v2',
                    sound: 'siren_alarm',
                    priority: 'high',
                    visibility: 'public'
                },
            },
            data: {
                alertId: newAlert._id.toString(),
                type: 'new_alert',
                imageUrl: imageUrl || ''
            }
        };

        try {
            // Using sendMulticast for v11 compatibility
            await admin.messaging().sendMulticast(message);
        } catch (error) {
            console.error('Error sending push notifications:', error);
        }
    }

    res.status(201).json({
      message: 'Alert created successfully',
      alert: populatedAlert,
    });
  } catch (error) {
    console.error("Alert Creation Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ... (Rest of the file remains stable)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const userRole = req.user.role;
    if (userRole !== 'admin' && userRole !== 'ems_personnel') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (status === 'completed') {
        const alertData = alert.toObject();
        delete alertData._id;
        const completedAlert = new CompletedAlert(alertData);
        await completedAlert.save();
        await Alert.findByIdAndDelete(req.params.id);
        req.io.emit('alert-archived', { alertId: req.params.id });
        return res.json({ message: 'Alert completed' });
    } else {
        alert.status = status;
        alert.updatedAt = new Date();
        await alert.save();
        const populatedAlert = await Alert.findById(alert._id)
            .populate('userId', 'email firstName lastName')
            .populate('assignedEMS', 'email firstName lastName phoneNumber');
        req.io.emit('alert-status-update', populatedAlert);
        res.json({ message: 'Status updated', alert: populatedAlert });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/completed', auth, async (req, res) => {
    try {
        const completedAlerts = await CompletedAlert.find().populate('userId', 'firstName lastName').sort({ archivedAt: -1 });
        res.json(completedAlerts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/', auth, async (req, res) => {
  try {
    const alerts = await Alert.find().populate('userId', 'firstName lastName').sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).populate('userId', 'firstName lastName');
    if (!alert) return res.status(404).json({ message: 'Not found' });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
