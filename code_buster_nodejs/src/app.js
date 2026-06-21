const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require("cors");
const dotenv = require('dotenv');

dotenv.config();

const logger = require('./config/logger');
const ApiError = require('./utils/ApiError');
const errorHandler = require('./middlewares/error');

const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/product');

const app = express();

app.disable('x-powered-by');

// CORS Middleware
// app.use(cors({
//   origin: "http://localhost:3000", // your frontend URL
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// }));

// In-Memory Rate Limiter (Max 500 requests per 15 mins per IP)
const rateLimitStore = {};
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000;
  const MAX_REQUESTS = 500;

  if (!rateLimitStore[ip]) {
    rateLimitStore[ip] = [];
  }

  rateLimitStore[ip] = rateLimitStore[ip].filter((timestamp) => now - timestamp < WINDOW_MS);

  if (rateLimitStore[ip].length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    });
  }

  rateLimitStore[ip].push(now);
  next();
});

app.use(morgan('combined', { stream: logger.stream }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, `API Route not found - ${req.originalUrl}`));
});
app.use(errorHandler);

module.exports = app;
