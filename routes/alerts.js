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

    if (!address) {
        return res.status(400).json({ message: 'Address / Location Description is required.' });
    }

    const formattedLocation = {
        latitude: location?.lat,
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
      imageUrl,
    });

    await newAlert.save();

    const populatedAlert = await Alert.findById(newAlert._id)
        .populate('userId', 'email firstName lastName')
        .populate('assignedEMS', 'email firstName lastName phoneNumber');

    req.io.emit('new-alert', populatedAlert);

    const staffUsers = await User.find({ role: { $in: ['ems_personnel', 'admin'] } });
    const tokens = staffUsers.flatMap(user => user.fcmTokens);

    if (tokens.length > 0) {
        const message = {
            notification: {
                title: 'New Emergency Alert!',
                body: `Incident: ${incidentType} at ${address}`,
            },
            tokens: tokens,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'ems_alerts',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: {
                            critical: 1,
                            name: 'default',
                            volume: 1.0,
                        },
                    },
                },
            },
        };

        try {
            await admin.messaging().sendMulticast(message);
            console.log('Critical push notifications sent successfully.');
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

    if (status === 'completed') {
        const alertData = alert.toObject();
        delete alertData._id;
        const completedAlert = new CompletedAlert(alertData);
        await completedAlert.save();
        await Alert.findByIdAndDelete(req.params.id);

        req.io.emit('alert-archived', { alertId: req.params.id });

        return res.json({ message: 'Alert completed and archived.' });

    } else {
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
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// --- Other routes remain unchanged ---

router.get('/completed', auth, async (req, res) => {
    try {
        const completedAlerts = await CompletedAlert.find()
            .populate('userId', 'email firstName lastName')
            .populate('assignedEMS', 'email firstName lastName phoneNumber')
            .sort({ archivedAt: -1 });
        res.json(completedAlerts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.delete('/completed/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admins can delete archived alerts.' });
    }
    try {
        await CompletedAlert.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Archived alert deleted successfully.' });
    } catch (error) {
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

module.exports = router;
