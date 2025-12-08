/**
 * Structured logging utility for MCP Server
 *
 * Uses pino for high-performance JSON logging with pretty printing in development.
 */

import pino from 'pino';
import type { Logger } from 'pino';

/**
 * Detect if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Create pino logger with appropriate configuration
 */
export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
});

/**
 * Log levels for convenience
 */
export const log = {
  debug: (msg: string, data?: Record<string, unknown>) => {
    if (data) {
      logger.debug(data, msg);
    } else {
      logger.debug(msg);
    }
  },

  info: (msg: string, data?: Record<string, unknown>) => {
    if (data) {
      logger.info(data, msg);
    } else {
      logger.info(msg);
    }
  },

  warn: (msg: string, data?: Record<string, unknown>) => {
    if (data) {
      logger.warn(data, msg);
    } else {
      logger.warn(msg);
    }
  },

  error: (msg: string, error?: Error | Record<string, unknown>) => {
    if (error instanceof Error) {
      logger.error({ err: error, stack: error.stack }, msg);
    } else if (error) {
      logger.error(error, msg);
    } else {
      logger.error(msg);
    }
  },
};

/**
 * Request logging helper for HTTP requests
 */
export interface RequestLogData {
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

export function logRequest(data: RequestLogData): void {
  const { method, url, statusCode, responseTime, error } = data;

  if (error) {
    log.error(`${method} ${url} - ERROR`, { method, url, error });
  } else if (statusCode && statusCode >= 400) {
    log.warn(`${method} ${url} - ${statusCode}`, {
      method,
      url,
      statusCode,
      responseTime,
    });
  } else {
    log.info(`${method} ${url} - ${statusCode || 'OK'}`, {
      method,
      url,
      statusCode,
      responseTime,
    });
  }
}

/**
 * Export logger instance for advanced usage
 */
export default logger;
