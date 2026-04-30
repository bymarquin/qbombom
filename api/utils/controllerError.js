'use strict';

const logger = require('./logger');

function handleControllerError(res, context, error) {
  const status = error?.status || 500;
  logger.error(context, error);
  return res.status(status).json({
    error: status === 500 ? 'Internal server error' : error.message,
  });
}

module.exports = {
  handleControllerError,
};
