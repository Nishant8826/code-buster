const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'code_buster',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: '127.0.0.1',
    port: 3306,
    dialect: 'mysql',
    logging: (sql) => logger.debug(`Sequelize SQL: ${sql}`),
    pool: {
      max: 15,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false
    }
  }
);

module.exports = sequelize;
