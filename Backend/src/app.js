const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const messageRoutes = require('./routes/message.routes');
const { globalErrorHandler } = require('./middleware/error.middleware');
const { AppError } = require('./utils/AppError');

const app = express();

// 1. Security middleware
app.use(helmet());

// 2. Body parsers (Inka pehle hona zaroori hai taaki data read ho sake)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 3. CORRECTED CORS Configuration (Vite frontend ke liye exact fix)
app.use(
  cors({
    // Agar .env mein CLIENT_URL nahi hai, toh automatic localhost:5173 uthaega
    origin: process.env.CLIENT_URL || 'http://localhost:5173', 
    credentials: true, // Cookies ko allow karne ke liye mandatory hai
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 4. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 5. Global Request Logger Middleware (Sahi position par taaki saare routes log hon)
app.use((req, res, next) => {
  console.log(`====== 🚨 INCOMING REQUEST 🚨 ======`);
  console.log(`METHOD: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`BODY:`, req.body);
  console.log(`===================================`);
  next();
});

// 6. Rate limiting (Temporary dev mode mein 100 max sahi hai, production mein badal sakte hain)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/messages', messageRoutes);

// 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;