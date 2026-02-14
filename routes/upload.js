const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');

// Configure Cloudinary
// The SDK will automatically use the CLOUDINARY_URL environment variable
// if it's set, which is the recommended practice.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

router.post('/sign', auth, async (req, res) => {
  try {
    const timestamp = Math.round((new Date).getTime()/1000);

    // Use the Cloudinary SDK to create a signed upload signature
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: 'incidents' // Optional: A folder name to organize uploads
      },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      cloudname: process.env.CLOUDINARY_CLOUD_NAME,
      apikey: process.env.CLOUDINARY_API_KEY,
    });

  } catch (error) {
    console.error('Error signing upload:', error);
    res.status(500).json({ message: 'Server error while creating upload signature.' });
  }
});

module.exports = router;
