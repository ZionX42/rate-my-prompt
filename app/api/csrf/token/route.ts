import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection } from '@/lib/security/csrf';

/**
 * CSRF Token API Endpoint
 * GET /api/csrf/token - Returns a new CSRF token
 */
export async function GET(_request: NextRequest) {
  try {
    return CSRFProtection.createTokenResponse();
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 });
  }
}
