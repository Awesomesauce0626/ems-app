const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Alert = require('../models/Alert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role: role || 'citizen',
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/save-fcm-token', auth, async (req, res) => {
    try {
        const { token: fcmToken } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (user && !user.fcmTokens.includes(fcmToken)) {
            user.fcmTokens.push(fcmToken);
            await user.save();
        }

        res.status(200).json({ message: 'FCM token saved successfully.' });
    } catch (error) {
        console.error("FCM Token Save Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/quick-access', async (req, res) => {
  try {
    const { reporterName, reporterPhone } = req.body;

    const tempToken = jwt.sign(
      { isQuickAccess: true, reporterPhone },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token: tempToken,
      isQuickAccess: true,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/delete-account', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    await Alert.deleteMany({ userId: userId });

    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account and all associated data have been permanently deleted.' });
  } catch (error) {
    console.error('Account Deletion Error:', error);
    res.status(500).json({ message: 'Server error during account deletion.' });
  }
});

module.exports = router;
