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
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (serviceAccountBase64) {
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('ascii');
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 not found in environment variables.');
  }
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

const app = express();
const httpServer = http.createServer(app);

const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';

const whitelist = [
  clientURL,
  'http://localhost:5173',
  'http://localhost',
  'capacitor://localhost',
  'https://localhost' // Critical for native Android CORS requests
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
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

const responderLocations = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('ems-location-update', (data) => {
    responderLocations.set(socket.id, { ...data, id: socket.id });
    io.emit('ems-locations-broadcast', Array.from(responderLocations.values()));
  });

  socket.on('disconnect', () => {
    responderLocations.delete(socket.id);
    io.emit('ems-locations-broadcast', Array.from(responderLocations.values()));
    console.log('User disconnected:', socket.id);
  });
});

if (isProduction) {
    app.use(express.static(path.join(__dirname, 'client/dist')));
    app.get('*' , (req,res) => {
        res.sendFile(path.join(__dirname, "client/dist/index.html"));
    })
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

startServer();
