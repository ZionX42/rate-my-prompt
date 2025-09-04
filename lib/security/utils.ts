import 'server-only';
import { randomBytes } from 'crypto';

/**
 * Security utilities for XSS protection and CSP
 */
export class SecurityUtils {
  /**
   * Generate a cryptographically secure nonce for CSP
   */
  static generateNonce(): string {
    return randomBytes(16).toString('base64');
  }

  /**
   * Generate a secure CSP header with nonce
   */
  static generateCSPWithNonce(nonce: string): string {
    return [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://js.sentry-cdn.com`,
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.sentry.io https://cloud.appwrite.io",
      "media-src 'self'",
      "object-src 'none'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'upgrade-insecure-requests',
      'report-uri /api/security/csp-report',
      'report-to /api/security/csp-report',
    ].join('; ');
  }

  /**
   * Validate if a string contains XSS patterns
   */
  static containsXSSPatterns(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /onclick\s*=/gi,
      /onmouseover\s*=/gi,
      /eval\s*\(/gi,
      /document\./gi,
      /window\./gi,
      /alert\s*\(/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<form[^>]*>/gi,
      /<input[^>]*>/gi,
      /<meta[^>]*>/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Sanitize HTML content for safe rendering
   */
  static sanitizeHtmlContent(html: string): string {
    // Remove potentially dangerous tags and attributes
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
      .replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, '')
      .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
      .replace(/<input[^>]*>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^>\s]+/gi, '');
  }

  /**
   * Generate secure headers for API responses
   */
  static getSecureApiHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    };
  }
}
