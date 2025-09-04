import { NextRequest } from 'next/server';
import { logRequest } from '@/lib/api/middleware';
import { ok, badRequest } from '@/lib/api/responses';

/**
 * CSP Violation Report Endpoint
 * Handles Content Security Policy violation reports from browsers
 * POST /api/security/csp-report
 */
export async function POST(req: NextRequest): Promise<Response> {
  logRequest(req);

  try {
    const report = await req.json();

    // Log CSP violation for monitoring
    console.warn('CSP Violation Report:', {
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      violation: {
        documentURI: report['csp-report']?.['document-uri'],
        violatedDirective: report['csp-report']?.['violated-directive'],
        effectiveDirective: report['csp-report']?.['effective-directive'],
        originalPolicy: report['csp-report']?.['original-policy'],
        blockedURI: report['csp-report']?.['blocked-uri'],
        statusCode: report['csp-report']?.['status-code'],
        sourceFile: report['csp-report']?.['source-file'],
        lineNumber: report['csp-report']?.['line-number'],
        columnNumber: report['csp-report']?.['column-number'],
      },
    });

    // In production, you might want to:
    // 1. Store these reports in a database
    // 2. Send alerts for critical violations
    // 3. Use services like Sentry or custom monitoring

    return ok({ received: true });
  } catch (error) {
    console.error('CSP Report processing error:', error);
    return badRequest('Invalid CSP report format');
  }
}
