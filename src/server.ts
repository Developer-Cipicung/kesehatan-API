import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const startServer = () => {
  try {
    const port = env.PORT || 3000;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error(error, 'Error starting server:');
    process.exit(1);
  }
};

startServer();
