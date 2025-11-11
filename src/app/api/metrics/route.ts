import { NextRequest } from 'next/server';
import { RequestMonitor } from '@/lib/monitoring/requestMonitor';
import { ok, unauthorized } from '@/lib/api/responses';

/**
 * Metrics Endpoint
 * GET /api/metrics
 * Returns detailed application metrics for monitoring
 */
export async function GET(req: NextRequest): Promise<Response> {
  // Basic authentication check for metrics endpoint
  const authHeader = req.headers.get('authorization');
  const apiKey = req.headers.get('x-api-key');

  // Allow access if API key matches or in development
  const isAuthorized =
    process.env.NODE_ENV === 'development' ||
    apiKey === process.env.METRICS_API_KEY ||
    (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === process.env.METRICS_API_KEY);

  if (!isAuthorized) {
    return unauthorized('Invalid API key');
  }

  try {
    const metrics = RequestMonitor.getMetrics();

    // Add additional system metrics
    const systemMetrics = {
      ...metrics,
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        pid: process.pid,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        version: process.env.npm_package_version,
      },
    };

    return ok(systemMetrics);
  } catch (error) {
    console.error('Metrics collection failed:', error);
    return ok({
      error: 'Metrics collection failed',
      timestamp: new Date().toISOString(),
    });
  }
}
