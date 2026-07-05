import express, { Express, Request, Response } from 'express';
import { loggerMiddleware } from './middleware/logger.middleware';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';

import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app: Express = express();

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window` (here, per 1 minute)
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per `window` (here, per 1 minute)
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(generalLimiter);
app.use(express.json());
app.use(loggerMiddleware);

import authRoutes from './routes/auth.routes';

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy.',
    data: {},
  });
});

app.use('/api/v1/auth', authLimiter, authRoutes);

// 404 Handler
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorMiddleware);

export default app;
