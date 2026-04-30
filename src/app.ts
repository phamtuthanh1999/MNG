import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import productRoutes from './routes/product.routes';
import authRoutes from './routes/auth.routes';
import commRoutes from './routes/comm.routes';
import storeRoutes from './routes/store.routes';
import userRoutes from './routes/user.routes';
import userStoreRoutes from './routes/user-store.routes';
import importRoutes from './routes/import.routes';
import exportRoutes from './routes/export.routes';
import reportRoutes from './routes/report.routes';
import webhookRoutes from './routes/webhook.routes';
import timeShiftRoutes from './routes/time-shift.routes';
import { timeSummary } from './controllers/time-shift.controller';
import { authMiddleware } from './middleware/auth';

// App configuration and middleware registration
dotenv.config();
const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://quanly.ptt.io.vn',
  'http://workclock.ptt.io.vn',
  'https://workclock.ptt.io.vn',
];

// CORS configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Built-in middleware to parse JSON request bodies
app.use(express.json());

// Register API routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/comms', commRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-stores', userStoreRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/time-shifts', timeShiftRoutes);
app.get('/api/time', authMiddleware, timeSummary);

// Simple health check for load balancers / container orchestrators
app.get('/health', (req, res) => res.json({ ok: true }));

export default app;
