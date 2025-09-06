import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor } from './performanceMonitor';
import { ErrorTracker } from './errorTracker';

// Edge Runtime compatible logging functions
const logApiRequest = (
  method: string,
  url: string,
  userId?: string,
  meta?: Record<string, unknown>
) => {
  console.log('API Request', { method, url, userId, ...meta });
};

const logApiResponse = (
  method: string,
  url: string,
  status: number,
  duration?: number,
  meta?: Record<string, unknown>
) => {
  console.log('API Response', { method, url, status, duration, ...meta });
};

const logError = (message: string, error?: unknown, meta?: Record<string, unknown>) => {
  console.error(message, { error, ...meta });
};

const logWarn = (message: string, meta?: Record<string, unknown>) => {
  console.warn(message, meta);
};

/**
 * Enhanced request logging and monitoring middleware
 */
export class RequestMonitor {
  private static requestCounts = new Map<string, number>();
  private static responseTimes: number[] = [];
  private static errorCounts = new Map<string, number>();

  /**
   * Log incoming request with enhanced metadata
   */
  static logRequest(req: NextRequest, userId?: string) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Start performance measurement and store the measurement ID
    const perfId = PerformanceMonitor.startMeasurement(`request_${req.method}_${req.url}`);

    // Extract request metadata
    const metadata = {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      ip: this.getClientIP(req),
      referer: req.headers.get('referer'),
      contentType: req.headers.get('content-type'),
      contentLength: req.headers.get('content-length'),
      acceptLanguage: req.headers.get('accept-language'),
      timestamp: new Date().toISOString(),
      userId,
    };

    // Log the request
    logApiRequest(req.method, req.url, userId, metadata);

    // Update request counts
    this.incrementRequestCount(req.method);

    // Store start time and performance ID for response logging
    (
      req as NextRequest & { __startTime?: number; __requestId?: string; __perfId?: string }
    ).__startTime = startTime;
    (
      req as NextRequest & { __startTime?: number; __requestId?: string; __perfId?: string }
    ).__requestId = requestId;
    (
      req as NextRequest & { __startTime?: number; __requestId?: string; __perfId?: string }
    ).__perfId = perfId;

    return requestId;
  }

  /**
   * Log response with performance metrics
   */
  static logResponse(req: NextRequest, res: NextResponse, userId?: string) {
    const startTime =
      (req as NextRequest & { __startTime?: number; __requestId?: string; __perfId?: string })
        .__startTime || Date.now();
    const requestId =
      (req as NextRequest & { __startTime?: number; __requestId?: string; __perfId?: string })
        .__requestId || this.generateRequestId();
    const perfId = (
      req as NextRequest & { __startTime?: number; __requestId?: string; __perfId?: string }
    ).__perfId;
    const duration = Date.now() - startTime;

    // Track response time with PerformanceMonitor (only if perfId exists)
    if (perfId) {
      try {
        PerformanceMonitor.endMeasurement(perfId);
      } catch (error) {
        // Silently handle performance measurement errors
        console.warn('Performance measurement failed:', error);
      }
    }

    // Track response time
    this.trackResponseTime(duration);

    const metadata = {
      requestId,
      method: req.method,
      url: req.url,
      status: res.status,
      duration,
      contentLength: res.headers.get('content-length'),
      contentType: res.headers.get('content-type'),
      timestamp: new Date().toISOString(),
      userId,
    };

    // Log based on status code
    if (res.status >= 400) {
      this.incrementErrorCount(res.status.toString());

      // Track error with ErrorTracker
      const errorMessage = `HTTP ${res.status} Error`;
      ErrorTracker.trackApiError(
        errorMessage,
        {
          method: req.method,
          url: req.url,
          userAgent: req.headers.get('user-agent') || undefined,
          userId,
        },
        {
          statusCode: res.status,
        }
      );

      if (res.status >= 500) {
        logError('Server Error Response', undefined, metadata);
      } else {
        logWarn('Client Error Response', metadata);
      }
    } else {
      logApiResponse(req.method, req.url, res.status, duration, metadata);
    }

    return duration;
  }

  /**
   * Log security events
   */
  static logSecurityEvent(event: string, req: NextRequest, details?: Record<string, unknown>) {
    logWarn(`Security Event: ${event}`, {
      ip: this.getClientIP(req),
      userAgent: req.headers.get('user-agent'),
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Get monitoring metrics
   */
  static getMetrics() {
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
    const avgResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0;

    return {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      requests: {
        total: totalRequests,
        byMethod: Object.fromEntries(this.requestCounts),
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        responseTimeSamples: this.responseTimes.length,
        minResponseTime: this.responseTimes.length > 0 ? Math.min(...this.responseTimes) : 0,
        maxResponseTime: this.responseTimes.length > 0 ? Math.max(...this.responseTimes) : 0,
        performanceStats: PerformanceMonitor.getStats(),
      },
      errors: {
        byStatus: Object.fromEntries(this.errorCounts),
        errorStats: ErrorTracker.getErrorStats(),
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
      },
    };
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  static resetMetrics() {
    this.requestCounts.clear();
    this.responseTimes.length = 0;
    this.errorCounts.clear();
  }

  /**
   * Get client IP from request
   */
  private static getClientIP(req: NextRequest): string {
    return (
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-client-ip') ||
      'unknown'
    );
  }

  /**
   * Generate unique request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Increment request count by method
   */
  private static incrementRequestCount(method: string) {
    const current = this.requestCounts.get(method) || 0;
    this.requestCounts.set(method, current + 1);
  }

  /**
   * Track response time
   */
  private static trackResponseTime(duration: number) {
    this.responseTimes.push(duration);

    // Keep only last 1000 samples to prevent memory issues
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  /**
   * Increment error count by status
   */
  private static incrementErrorCount(status: string) {
    const current = this.errorCounts.get(status) || 0;
    this.errorCounts.set(status, current + 1);
  }
}
