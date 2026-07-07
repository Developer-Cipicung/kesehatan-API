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
import wargaRoutes from './routes/warga.routes';
import balitaRoutes from './routes/balita.routes';
import imunisasiRoutes from './routes/imunisasi.routes';
import bumilRoutes from './routes/bumil.routes';
import pascaPersalinanRoutes from './routes/pasca-persalinan.routes';
import lansiaRoutes from './routes/lansia.routes';
import pendataanRoutes from './routes/pendataan.routes';
import dashboardRoutes from './routes/dashboard.routes';
import posyanduRoutes from './routes/posyandu.routes';
import userRoutes from './routes/user.routes';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

// Serve static files from public
app.use(express.static(path.join(__dirname, 'public')));

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));

// Swagger UI Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customJs: '/swagger-custom.js'
}));

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy.',
    data: {},
  });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/warga', wargaRoutes);
app.use('/api/v1/balita', balitaRoutes);
app.use('/api/v1/imunisasi', imunisasiRoutes);
app.use('/api/v1/bumil', bumilRoutes);
app.use('/api/v1/pasca-persalinan', pascaPersalinanRoutes);
app.use('/api/v1/lansia', lansiaRoutes);
app.use('/api/v1/pendataan-bulanan', pendataanRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/posyandu', posyanduRoutes);
app.use('/api/v1/users', userRoutes);

// 404 Handler
app.use(notFoundMiddleware);

// Global Error Handler
app.use(errorMiddleware);

export default app;
