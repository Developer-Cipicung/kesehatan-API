import express, { Express, Request, Response } from 'express';
import fs from 'fs';
import { loggerMiddleware } from './middleware/logger.middleware';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';

import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app: Express = express();

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window` (here, per 1 minute),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per `window` (here, per 1 minute)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://unpkg.com'],
      styleSrc: ["'self'", 'https://unpkg.com', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'https://unpkg.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
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
import YAML from 'yamljs';
import path from 'path';

// Load Swagger document
const swaggerPath = path.join(__dirname, '../docs/swagger.yaml');
let swaggerDocument: Record<string, unknown> | null = null;
if (fs.existsSync(swaggerPath)) {
  swaggerDocument = YAML.load(swaggerPath) as Record<string, unknown>;
}

// Serve OpenAPI spec as JSON (used by Swagger UI)
app.get('/api-docs/swagger.json', (_req: Request, res: Response) => {
  if (!swaggerDocument) {
    res.status(404).json({ error: 'Swagger spec not found' });
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerDocument);
});

// Serve Swagger UI init script to avoid inline script CSP issues
app.get('/api-docs/swagger-init.js', (_req: Request, res: Response) => {
  const js = `window.onload = function () {
    SwaggerUIBundle({
      url: "/api-docs/swagger.json",
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout',
      deepLinking: true,
    });
  };`;
  res.setHeader('Content-Type', 'application/javascript');
  res.send(js);
});

// Swagger UI — serve raw HTML loading all assets from CDN (works on Vercel serverless)
app.get('/api-docs', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>API Kesehatan Cipicung — Docs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script src="/api-docs/swagger-init.js"></script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});


// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    name: "API Kesehatan Cipicung",
    status: "Server is up!",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
})

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
