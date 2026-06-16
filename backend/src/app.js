const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/error');

// Route imports
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityRoutes = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      const isAllowed = 
        allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') || 
        origin.endsWith('.netlify.app') ||
        origin === 'https://vercel.app' ||
        origin === 'https://netlify.app';

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public/uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/settlements', settlementRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Base health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Roomies Khata API Server is running!' });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
