import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Configure DOMPurify for safer defaults
DOMPurify.setConfig({
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'p', 'br'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
});

export interface SanitizeOptions {
  allowHtml?: boolean;
  maxLength?: number;
  trim?: boolean;
  normalizeWhitespace?: boolean;
}

/**
 * Comprehensive text sanitization function
 */
export function sanitizeText(input: string, options: SanitizeOptions = {}): string {
  const { allowHtml = false, maxLength = 10000, trim = true, normalizeWhitespace = true } = options;

  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim whitespace if requested
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Normalize whitespace
  if (normalizeWhitespace) {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }

  // Additional malicious pattern filtering (apply to all cases)
  // Remove javascript: protocols and other dangerous patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  if (!allowHtml) {
    // Also remove event handlers when HTML is not allowed
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  }

  // Handle HTML content
  if (allowHtml) {
    // Sanitize HTML to prevent XSS
    sanitized = DOMPurify.sanitize(sanitized);
  } else {
    // Escape HTML entities
    sanitized = validator.escape(sanitized);
  }

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';

  const trimmed = email.trim().toLowerCase();
  return validator.isEmail(trimmed) ? validator.normalizeEmail(trimmed) || trimmed : '';
}

/**
 * Sanitize URLs
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';

  const trimmed = url.trim();

  // Check if it's a valid URL
  if (
    !validator.isURL(trimmed, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
      allow_underscores: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
    })
  ) {
    return '';
  }

  return trimmed;
}

/**
 * Sanitize user display names
 */
export function sanitizeDisplayName(name: string): string {
  return sanitizeText(name, {
    allowHtml: false,
    maxLength: 100,
    trim: true,
    normalizeWhitespace: true,
  });
}

/**
 * Sanitize user bio/description content
 */
export function sanitizeBio(bio: string): string {
  return sanitizeText(bio, {
    allowHtml: false,
    maxLength: 500,
    trim: true,
    normalizeWhitespace: true,
  });
}

/**
 * Sanitize prompt content (allows some formatting)
 */
export function sanitizePromptContent(content: string): string {
  return sanitizeText(content, {
    allowHtml: true, // Allow basic formatting
    maxLength: 10000,
    trim: true,
    normalizeWhitespace: false, // Preserve formatting
  });
}

/**
 * Sanitize comment content
 */
export function sanitizeCommentContent(content: string): string {
  return sanitizeText(content, {
    allowHtml: false,
    maxLength: 2000,
    trim: true,
    normalizeWhitespace: true,
  });
}

/**
 * Sanitize search queries
 */
export function sanitizeSearchQuery(query: string): string {
  return sanitizeText(query, {
    allowHtml: false,
    maxLength: 200,
    trim: true,
    normalizeWhitespace: true,
  });
}

/**
 * Sanitize tags array
 */
export function sanitizeTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) =>
      sanitizeText(tag, {
        allowHtml: false,
        maxLength: 50,
        trim: true,
        normalizeWhitespace: true,
      })
    )
    .filter((tag) => tag.length > 0)
    .slice(0, 10); // Limit to 10 tags
}

/**
 * Detect potentially malicious patterns
 */
export function detectMaliciousPatterns(input: string): boolean {
  if (typeof input !== 'string') return false;

  const maliciousPatterns = [
    // Script injection patterns
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,

    // Event handler patterns
    /on\w+\s*=/gi,

    // SQL injection patterns (more comprehensive)
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(\bor\b\s*['"`]?\d+['"`]?\s*=\s*['"`]?\d+['"`]?)/gi,
    /(\band\b\s*['"`]?\d+['"`]?\s*=\s*['"`]?\d+['"`]?)/gi,
    /('.*--)|('.*#)|('.*\/\*)/gi,
    /(\)|(\s+))+or(\s+)+('|")/gi,
    /(admin['"`]\s*--)/gi,
    /(admin['"`]\s*#)/gi,
    /(admin['"`]\s*\/\*)/gi,

    // Command injection patterns
    /(;|\||&|`|\$\(|\${)/gi,
    /(rm\s+-rf|wget|curl|nc\s+-l|powershell|cmd|bash)/gi,

    // Path traversal
    /(\.\.\/|\.\.\\)/gi,
  ];

  return maliciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Rate limiting key sanitization
 */
export function sanitizeRateLimitKey(ip: string): string {
  // First extract just the IP portion (IPv4 or IPv6)
  const ipv4Match = ip.match(/^[\d.]+/);
  const ipv6Match = ip.match(/^[0-9a-fA-F:]+/);

  if (ipv4Match && ipv4Match[0].includes('.')) {
    return ipv4Match[0];
  }
  if (ipv6Match && ipv6Match[0].includes(':')) {
    return ipv6Match[0];
  }

  // Fallback: remove any non-standard IP characters
  return ip.replace(/[^0-9a-fA-F:.]/g, '');
}
