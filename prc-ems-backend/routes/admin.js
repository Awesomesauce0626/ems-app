const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to check for admin role
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', [auth, adminAuth], async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude passwords from the result
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/admin/users/:id/role
// @desc    Update a user's role
// @access  Admin
router.patch('/users/:id/role', [auth, adminAuth], async (req, res) => {
    try {
        const { role } = req.body;

        // Basic validation
        if (!['citizen', 'ems_personnel', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({ message: `User role updated to ${role}` });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
