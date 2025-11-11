import 'server-only';

/**
 * Error tracking and monitoring utilities
 */
export class ErrorTracker {
  private static errors: Array<{
    id: string;
    timestamp: Date;
    message: string;
    stack?: string;
    url?: string;
    userAgent?: string;
    userId?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, unknown>;
  }> = [];

  private static readonly MAX_ERRORS = 1000;

  /**
   * Track an error
   */
  static trackError(
    error: Error | string,
    context?: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      url?: string;
      userAgent?: string;
      userId?: string;
      additionalContext?: Record<string, unknown>;
    }
  ) {
    const errorObj = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      url: context?.url,
      userAgent: context?.userAgent,
      userId: context?.userId,
      severity: context?.severity || 'medium',
      context: context?.additionalContext,
    };

    this.errors.push(errorObj);

    // Keep only the most recent errors
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(-this.MAX_ERRORS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Tracked Error:', errorObj);
    }

    return errorObj.id;
  }

  /**
   * Track an API error
   */
  static trackApiError(
    error: Error | string,
    request: {
      method: string;
      url: string;
      userAgent?: string;
      userId?: string;
    },
    response?: {
      statusCode: number;
    }
  ) {
    return this.trackError(error, {
      severity: response?.statusCode && response.statusCode >= 500 ? 'high' : 'medium',
      url: request.url,
      userAgent: request.userAgent,
      userId: request.userId,
      additionalContext: {
        method: request.method,
        statusCode: response?.statusCode,
      },
    });
  }

  /**
   * Get error statistics
   */
  static getErrorStats(timeRange?: { start: Date; end: Date }) {
    let filteredErrors = this.errors;

    if (timeRange) {
      filteredErrors = this.errors.filter(
        (error) => error.timestamp >= timeRange.start && error.timestamp <= timeRange.end
      );
    }

    const stats = {
      total: filteredErrors.length,
      bySeverity: {
        low: filteredErrors.filter((e) => e.severity === 'low').length,
        medium: filteredErrors.filter((e) => e.severity === 'medium').length,
        high: filteredErrors.filter((e) => e.severity === 'high').length,
        critical: filteredErrors.filter((e) => e.severity === 'critical').length,
      },
      recent: filteredErrors.slice(-10), // Last 10 errors
    };

    return stats;
  }

  /**
   * Get errors by severity
   */
  static getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical', limit = 50) {
    return this.errors.filter((error) => error.severity === severity).slice(-limit);
  }

  /**
   * Clear old errors
   */
  static clearOldErrors(olderThan: Date) {
    this.errors = this.errors.filter((error) => error.timestamp >= olderThan);
  }

  /**
   * Export errors for analysis
   */
  static exportErrors() {
    return {
      exportTime: new Date(),
      errors: this.errors,
      summary: this.getErrorStats(),
    };
  }

  /**
   * Create an error boundary wrapper
   */
  static createErrorBoundary<T extends (...args: unknown[]) => unknown>(
    fn: T,
    context?: Record<string, unknown>
  ): T {
    return ((...args: unknown[]) => {
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.catch((error) => {
            this.trackError(error as Error, {
              additionalContext: { ...context, args },
            });
            throw error;
          });
        }
        return result;
      } catch (error) {
        this.trackError(error as Error, {
          additionalContext: { ...context, args },
        });
        throw error;
      }
    }) as T;
  }
}
