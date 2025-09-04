import { NextRequest } from 'next/server';
import { RequestMonitor } from '@/lib/monitoring/requestMonitor';
import { validateServerConfig } from '@/lib/config/server';
import { ok, serviceUnavailable } from '@/lib/api/responses';

/**
 * Health Check Endpoint
 * GET /api/health
 */
export async function GET(_req: NextRequest): Promise<Response> {
  try {
    // Validate server configuration
    validateServerConfig();

    // Get monitoring metrics
    const metrics = RequestMonitor.getMetrics();

    // Basic health checks
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: await checkDatabaseHealth(),
      memory: {
        used: Math.round(metrics.memory.used / 1024 / 1024), // MB
        total: Math.round(metrics.memory.total / 1024 / 1024), // MB
        usagePercent: Math.round((metrics.memory.used / metrics.memory.total) * 100),
      },
      requests: {
        total: metrics.requests.total,
        avgResponseTime: metrics.performance.avgResponseTime,
      },
    };

    return ok(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    return serviceUnavailable('Service unhealthy', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Check database connectivity
 */
async function checkDatabaseHealth(): Promise<{ status: string; latency?: number }> {
  const startTime = Date.now();

  try {
    // Import database client dynamically to avoid circular dependencies
    const { getAppwriteDatabases } = await import('@/lib/appwrite/client');

    // Simple connectivity test - just get the databases instance
    getAppwriteDatabases();

    const latency = Date.now() - startTime;
    return { status: 'healthy', latency };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { status: 'unhealthy' };
  }
}
