import { NextRequest } from 'next/server';
import { logRequest } from '@/lib/api/middleware';
import { ok, badRequest, unauthorized } from '@/lib/api/responses';
import { isCurrentUserAdmin } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

/**
 * CSP Toggle API Endpoint
 * Allows administrators to enable/disable Content Security Policy
 * GET /api/admin/csp - Get current CSP status
 * POST /api/admin/csp - Toggle CSP on/off
 */

export async function GET(req: NextRequest): Promise<Response> {
  logRequest(req);

  try {
    // Check admin authentication
    const adminCheck = await isCurrentUserAdmin();
    if (!adminCheck) {
      return unauthorized('Admin access required');
    }

    // Read current CSP status from environment
    const cspEnabled = process.env.CSP_ENABLED !== 'true';

    return ok({
      cspEnabled,
      message: `Content Security Policy is currently ${cspEnabled ? 'enabled' : 'disabled'}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('CSP status check error:', error);
    return badRequest('Failed to check CSP status');
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  logRequest(req);

  try {
    // Check admin authentication
    const adminCheck = await isCurrentUserAdmin();
    if (!adminCheck) {
      return unauthorized('Admin access required');
    }

    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return badRequest('Invalid request: "enabled" must be a boolean');
    }

    // Update environment variable
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch {
      return badRequest('Could not read environment file');
    }

    // Update or add CSP_ENABLED variable
    const cspEnabledRegex = /^CSP_ENABLED=.*$/m;
    const newCspEnabled = `CSP_ENABLED="${enabled}"`;

    if (cspEnabledRegex.test(envContent)) {
      envContent = envContent.replace(cspEnabledRegex, newCspEnabled);
    } else {
      envContent += `\n${newCspEnabled}`;
    }

    // Write updated content back to .env file
    fs.writeFileSync(envPath, envContent, 'utf8');

    // Update process environment for immediate effect
    process.env.CSP_ENABLED = enabled.toString();

    return ok({
      cspEnabled: enabled,
      message: `Content Security Policy has been ${enabled ? 'enabled' : 'disabled'}`,
      note: 'Changes will take effect on the next request. For immediate effect, restart the server.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('CSP toggle error:', error);
    return badRequest('Failed to toggle CSP');
  }
}
