import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import paymentRoutes from './routes/payments.js';
import qrRoutes from './routes/qr.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import { authRateLimit } from './middleware/rateLimit.js';

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map(x => x.trim()).filter(Boolean);
if (isProduction && (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'memory')) {
  throw new Error('Set MONGODB_URI to a persistent MongoDB replica set in production.');
}
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Set JWT_SECRET to a random secret with at least 32 characters.');
}
if (isProduction && allowedOrigins.length === 0) {
  throw new Error('Set CLIENT_ORIGIN to the allowed app origins.');
}

const app = express();
if (isProduction) app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(cors({ origin: (origin, callback) => callback(null, !origin || !allowedOrigins.length || allowedOrigins.includes(origin)) }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'PocketPay API' }));
app.use('/api/auth/register', authRateLimit);
app.use('/api/auth/login', authRateLimit);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ error: 'Please check the information you entered' });
  if (err?.name === 'ZodError') return res.status(400).json({ error: err.issues?.[0]?.message || 'Invalid request' });
  if (err?.code === 11000) return res.status(409).json({ error: 'This account or payment request already exists' });
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong. Please try again.' });
});

const port = Number(process.env.PORT || 4000);
async function start() {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pocketpay';
  if (uri === 'memory') {
    if (isProduction) throw new Error('Temporary MongoDB is only available for local development.');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const memoryMongo = await MongoMemoryServer.create({ instance: { dbName: 'pocketpay' } });
    uri = memoryMongo.getUri();
    console.log('Using temporary in-memory MongoDB; data resets when the API stops.');
  }
  await mongoose.connect(uri);
  app.listen(port, '0.0.0.0', () => console.log(`PocketPay API listening on ${port}`));
}
start().catch(e => { console.error('MongoDB connection failed:', e); process.exit(1); });
