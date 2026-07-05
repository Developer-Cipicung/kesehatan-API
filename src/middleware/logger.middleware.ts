import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const loggerMiddleware = pinoHttp({
  logger,
  autoLogging: env.NODE_ENV !== 'test',
});
