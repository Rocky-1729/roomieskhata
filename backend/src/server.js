require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { init } = require('./config/socket');
const { configureCloudinary } = require('./config/cloudinary');

// Connect to Database
connectDB();

// Initialize Cloudinary storage configurations
configureCloudinary();

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize WebSockets
init(server);

// Listen to network port
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server and exit process
  server.close(() => process.exit(1));
});
