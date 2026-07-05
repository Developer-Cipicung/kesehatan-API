import express, { Express, Request, Response } from 'express';
import { loggerMiddleware } from './middleware/logger.middleware';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(loggerMiddleware);

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy.',
    data: {},
  });
});

// 404 Handler
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorMiddleware);

export default app;
