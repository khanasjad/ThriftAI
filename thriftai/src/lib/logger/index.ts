import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
}

// Add colors to winston
winston.addColors(logColors)

// Determine log level based on environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

// Create logs directory path
const logsDir = path.join(process.cwd(), 'logs')

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// File format for production
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Create transports array
const transports: winston.transport[] = []

// Always add console transport
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  )
}

// Add file transports for non-test environments
if (process.env.NODE_ENV !== 'test') {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
    })
  )

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
    })
  )
}

// Create the winston logger
const winstonLogger = winston.createLogger({
  level: getLogLevel(),
  levels: logLevels,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
})

// Create a stream object for HTTP request logging
const loggerStream = {
  write: (message: string) => {
    winstonLogger.http(message.trim())
  },
}

// Enhanced logging methods with context
interface LogContext {
  requestId?: string
  userId?: string
  component?: string
  action?: string
  duration?: number
  metadata?: Record<string, any>
}

class Logger {
  private static instance: Logger
  private winston: winston.Logger

  private constructor() {
    this.winston = winstonLogger
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  // Core logging methods
  public error(message: string, error?: Error | unknown, context?: LogContext): void {
    const logData: any = {
      message,
      ...context,
    }

    if (error) {
      if (error instanceof Error) {
        logData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      } else {
        logData.error = error
      }
    }

    this.winston.error(logData)
  }

  public warn(message: string, context?: LogContext): void {
    this.winston.warn({ message, ...context })
  }

  public info(message: string, context?: LogContext): void {
    this.winston.info({ message, ...context })
  }

  public http(message: string, context?: LogContext): void {
    this.winston.http({ message, ...context })
  }

  public debug(message: string, context?: LogContext): void {
    this.winston.debug({ message, ...context })
  }

  // Specific use case methods
  public apiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Omit<LogContext, 'duration'>
  ): void {
    this.info(`${method} ${url} ${statusCode}`, {
      ...context,
      component: 'API',
      duration,
      metadata: {
        method,
        url,
        statusCode,
      },
    })
  }

  public apiError(
    method: string,
    url: string,
    error: Error,
    context?: LogContext
  ): void {
    this.error(`API Error: ${method} ${url}`, error, {
      ...context,
      component: 'API',
      metadata: {
        method,
        url,
      },
    })
  }

  public securityEvent(
    event: string,
    details: Record<string, any>,
    context?: LogContext
  ): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      component: 'Security',
      metadata: details,
    })
  }

  public businessEvent(
    event: string,
    details: Record<string, any>,
    context?: LogContext
  ): void {
    this.info(`Business Event: ${event}`, {
      ...context,
      component: 'Business',
      metadata: details,
    })
  }

  public performance(
    operation: string,
    duration: number,
    context?: Omit<LogContext, 'duration'>
  ): void {
    const level = duration > 1000 ? 'warn' : 'info'
    this.winston[level](`Performance: ${operation} took ${duration}ms`, {
      ...context,
      component: 'Performance',
      duration,
      metadata: {
        operation,
      },
    })
  }

  // Database operation logging
  public dbQuery(
    query: string,
    duration: number,
    rowCount?: number,
    context?: LogContext
  ): void {
    const level = duration > 100 ? 'warn' : 'debug'
    this.winston[level](`DB Query executed in ${duration}ms`, {
      ...context,
      component: 'Database',
      duration,
      metadata: {
        query: query.substring(0, 200), // Truncate long queries
        rowCount,
      },
    })
  }

  public dbError(query: string, error: Error, context?: LogContext): void {
    this.error(`Database Error`, error, {
      ...context,
      component: 'Database',
      metadata: {
        query: query.substring(0, 200),
      },
    })
  }

  // AI service logging
  public aiRequest(
    provider: string,
    model: string,
    tokens: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info(`AI Request: ${provider}/${model} - ${tokens} tokens`, {
      ...context,
      component: 'AI',
      duration,
      metadata: {
        provider,
        model,
        tokens,
      },
    })
  }

  public aiError(
    provider: string,
    model: string,
    error: Error,
    context?: LogContext
  ): void {
    this.error(`AI Service Error: ${provider}/${model}`, error, {
      ...context,
      component: 'AI',
      metadata: {
        provider,
        model,
      },
    })
  }

  // Get the underlying winston instance for advanced usage
  public getWinston(): winston.Logger {
    return this.winston
  }

  // Get the stream for HTTP logging middleware
  public getStream() {
    return loggerStream
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Export types for external use
export type { LogContext }

// Export the Logger class for testing
export { Logger }

// Default export
export default logger