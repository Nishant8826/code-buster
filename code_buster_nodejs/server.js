const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const { sequelize } = require('./src/models');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (error) => {
  logger.error(`CRITICAL: Uncaught Exception - ${error.message}`, { stack: error.stack });
  process.exit(1);
});

const bootstrap = async () => {
  try {
    logger.info('Authenticating database connection...');
    await sequelize.authenticate();
    logger.info('Database connection authenticated successfully.');

    logger.info('Synchronizing models with database...');
    await sequelize.sync({ force: false });
    logger.info('Database sync completed successfully.');

    const server = app.listen(PORT, () => {
      logger.info(`App started and running in '${process.env.NODE_ENV || 'development'}' mode on port ${PORT}`);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('CRITICAL: Unhandled Promise Rejection at:', { promise, reason });
      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    logger.error(`Bootstrap Failed: Unable to start server due to: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
};

bootstrap();
