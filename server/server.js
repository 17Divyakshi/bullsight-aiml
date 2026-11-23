import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import requestLogger from './middleware/requestLogger.js';
import errorHandler from './middleware/errorHandler.js';
import notFoundHandler from './middleware/notFoundHandler.js';

import stockRoutes from './routes/stockRoutes.js';
import indicatorRoutes from './routes/indicatorRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bee2DemoRoutes from './routes/bee2DemoRoutes.js';
import { getPrediction } from './controllers/predictionController.js';
import { getScreener } from './controllers/marketController.js';
import { getBacktesting, getCE2Plot, getCE2Status, getSystemStatus } from './controllers/aiController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');

// Connect to MongoDB (gracefully falls back to in-memory store if offline)
connectDB();

// Global Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health Check API
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'BULLSIGHT AIML CE-2 Server',
    version: '2.0.0',
    stack: 'React, Vite, Express.js, FastAPI ML Bridge',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes under /api prefix
app.use('/api/stocks', stockRoutes);
app.use('/api/stocks', indicatorRoutes);
app.use('/api/predictions', predictionRoutes);

// FastAPI compatibility alias: /api/stocks/:symbol/prediction
app.get('/api/stocks/:symbol/prediction', getPrediction);

app.use('/api/market', marketRoutes);

// Screener direct route compatibility: /api/screener
app.get('/api/screener', getScreener);

app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);

// Model metrics & training endpoints: /api/model/metrics & /api/model/train
app.use('/api/model', aiRoutes);

// CE-2 artifacts, backtesting, system status, and exported Colab plots
app.get('/api/system/status', getSystemStatus);
app.get('/api/backtesting', getBacktesting);
app.get('/api/ce2/status', getCE2Status);
app.get('/api/ce2/plots/:filename', getCE2Plot);

app.use('/api/user/watchlist', watchlistRoutes);
app.use('/api/user/portfolio', portfolioRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/bee2-demo', bee2DemoRoutes);

// 404 Route Not Found Middleware for unknown /api endpoints
app.use('/api/*', notFoundHandler);

// Serve built React frontend static assets and SPA fallback
app.use(express.static(frontendDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Centralized Global Error Handler Middleware
app.use(errorHandler);

// Start HTTP Server on 0.0.0.0:3000
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🐂 BULLSIGHT MERN Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 BEE-II Lab Demos: http://localhost:${PORT}/api/bee2-demo/system-info`);
  console.log(`=======================================================`);
});

// Handle unhandled Promise rejections and exceptions
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] ${err.message}`);
});

process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception] ${err.message}`);
});

export default app;
