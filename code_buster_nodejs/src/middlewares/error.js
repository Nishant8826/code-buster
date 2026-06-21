const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    let errors = [];

    if (error.name === 'SequelizeValidationError') {
      statusCode = 422;
      message = 'Validation failed';
      errors = error.errors.map((e) => ({
        field: e.path,
        message: e.message
      }));
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      statusCode = 409;
      message = 'Resource already exists';
      errors = error.errors.map((e) => ({
        field: e.path,
        message: `${e.path} must be unique`
      }));
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      statusCode = 400;
      message = 'Invalid reference. Referenced record does not exist or is constrained.';
    } else if (error.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'File size limit exceeded';
    } else if (error.type === 'entity.parse.failed') {
      statusCode = 400;
      message = 'Malformed JSON payload';
    }

    error = new ApiError(statusCode, message, errors);
  }

  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - Server Error: ${error.stack}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - Client Error (${error.statusCode}): ${error.message} - Errors: ${JSON.stringify(error.errors)}`);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors
  });
};

module.exports = errorHandler;
