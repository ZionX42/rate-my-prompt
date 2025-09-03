import winston from 'winston';

// Create logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'prompt-hub',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

// Add file logging in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

// Helper functions for common logging patterns
export const logError = (message: string, error?: unknown, meta?: Record<string, unknown>) => {
  logger.error(message, { error, ...meta });
};

export const logWarn = (message: string, meta?: Record<string, unknown>) => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: Record<string, unknown>) => {
  logger.info(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, unknown>) => {
  logger.debug(message, meta);
};

// Log API requests and responses
export const logApiRequest = (
  method: string,
  url: string,
  userId?: string,
  meta?: Record<string, unknown>
) => {
  logger.info('API Request', {
    method,
    url,
    userId,
    type: 'api_request',
    ...meta,
  });
};

export const logApiResponse = (
  method: string,
  url: string,
  status: number,
  duration?: number,
  meta?: Record<string, unknown>
) => {
  logger.info('API Response', {
    method,
    url,
    status,
    duration,
    type: 'api_response',
    ...meta,
  });
};

// Log business operations
export const logUserAction = (action: string, userId: string, meta?: Record<string, unknown>) => {
  logger.info('User Action', {
    action,
    userId,
    type: 'user_action',
    ...meta,
  });
};

export const logDatabaseOperation = (
  operation: string,
  table: string,
  meta?: Record<string, unknown>
) => {
  logger.debug('Database Operation', {
    operation,
    table,
    type: 'database_operation',
    ...meta,
  });
};

export default logger;
