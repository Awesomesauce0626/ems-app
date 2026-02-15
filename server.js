const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// --- FINAL, FOOLPROOF FIX: Initialize Firebase from a single, Base64-encoded service account file ---
if (isProduction) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('ascii');
  const serviceAccount = JSON.parse(serviceAccountJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  const serviceAccount = require('./firebase-service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const authRoutes = require('./routes/auth');
const alertRoutes = require('./routes/alerts');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/upload');

const app = express();
const httpServer = http.createServer(app);

const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

const whitelist = [
  clientURL,
  'http://localhost:5173',
  'http://localhost',
  'capacitor://localhost'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  optionsSuccessStatus: 200,
};

const io = new Server(httpServer, { cors: corsOptions });

app.use(cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// THIS BLOCK HAS BEEN REMOVED AS IT WAS CAUSING THE SERVER TO CRASH
// if (isProduction) {
//   app.use(express.static(path.join(__dirname, 'client/dist')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
//   });
// }

const responderLocations = new Map();

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('ems-location-update', (data) => {
    responderLocations.set(socket.id, { ...data, id: socket.id });
    io.emit('ems-locations-broadcast', Array.from(responderLocations.values()));
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    responderLocations.delete(socket.id);
    io.emit('ems-locations-broadcast', Array.from(responderLocations.values()));
  });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully.');
    httpServer.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

startServer();
