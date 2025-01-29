const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const todoRoutes = require('./routes/todoRoutes');
const authRoutes = require('./routes/auth'); // Explicit import for clarity

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
if (!process.env.MONGO_URI || !process.env.PORT) {
  console.error('Missing required environment variables (MONGO_URI or PORT).');
  process.exit(1); // Exit process if essential environment variables are missing
}

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*', // Allow requests from a trusted client URL
    optionsSuccessStatus: 200,
  })
);

// Routes
app.use('/api', todoRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// MongoDB Atlas Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB Atlas:', err);
    process.exit(1); // Exit the process if the database connection fails
  });

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
