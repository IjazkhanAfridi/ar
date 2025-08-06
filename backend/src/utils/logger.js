/**
 * Logger utility with different levels
 */
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Format timestamp
   */
  getTimestamp() {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  /**
   * Format log message
   */
  formatMessage(level, message, source = 'app') {
    const timestamp = this.getTimestamp();
    return `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}`;
  }

  /**
   * Info level logging
   */
  info(message, source) {
    console.log(this.formatMessage('info', message, source));
  }

  /**
   * Warning level logging
   */
  warn(message, source) {
    console.warn(this.formatMessage('warn', message, source));
  }

  /**
   * Error level logging
   */
  error(message, source, error) {
    console.error(this.formatMessage('error', message, source));
    if (error && this.isDevelopment) {
      console.error(error);
    }
  }

  /**
   * Debug level logging (only in development)
   */
  debug(message, source) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, source));
    }
  }

  /**
   * Request logging middleware
   */
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      // Capture JSON response
      let capturedJsonResponse;
      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on('finish', () => {
        const duration = Date.now() - start;
        let logMessage = `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`;
        
        // Add response summary for API endpoints
        if (req.path.startsWith('/api') && capturedJsonResponse) {
          const responseInfo = capturedJsonResponse.success ? 'SUCCESS' : 'ERROR';
          logMessage += ` - ${responseInfo}`;
        }

        // Truncate long messages
        if (logMessage.length > 100) {
          logMessage = logMessage.slice(0, 97) + '...';
        }

        this.info(logMessage, 'http');
      });

      next();
    };
  }
}

export const logger = new Logger();
