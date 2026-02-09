const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
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

const app = express();
const httpServer = http.createServer(app);

const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

const corsOptions = {
  origin: isProduction ? clientURL : 'http://localhost:5173',
  optionsSuccessStatus: 200
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

if (isProduction) {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
  });
}

// --- LIVE TRACKING: In-memory storage for responder locations ---
const responderLocations = new Map();

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // --- LIVE TRACKING: Listen for location updates from EMS personnel ---
  socket.on('ems-location-update', (data) => {
    responderLocations.set(socket.id, { ...data, id: socket.id });
    // Broadcast the updated locations to all clients
    io.emit('ems-locations-broadcast', Array.from(responderLocations.values()));
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
    // --- LIVE TRACKING: Remove disconnected user from the map ---
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
