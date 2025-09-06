import 'server-only';
import validator from 'validator';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a DOMPurify instance for server-side usage
const window = new JSDOM('').window;
const DOMPurifyServer = DOMPurify(window);

export class InputValidation {
  /**
   * Validate and sanitize email addresses
   */
  static validateEmail(email: string): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];

    if (!email || typeof email !== 'string') {
      errors.push('Email is required');
      return { isValid: false, sanitized: '', errors };
    }

    const trimmed = email.trim();

    if (trimmed.length === 0) {
      errors.push('Email cannot be empty');
      return { isValid: false, sanitized: '', errors };
    }

    if (trimmed.length > 254) {
      errors.push('Email is too long');
      return { isValid: false, sanitized: '', errors };
    }

    if (!validator.isEmail(trimmed, { allow_utf8_local_part: false })) {
      errors.push('Invalid email format');
      return { isValid: false, sanitized: '', errors };
    }

    // Additional security checks
    if (trimmed.includes('<script') || trimmed.includes('javascript:')) {
      errors.push('Email contains suspicious content');
      return { isValid: false, sanitized: '', errors };
    }

    return { isValid: true, sanitized: validator.normalizeEmail(trimmed) || trimmed, errors: [] };
  }

  /**
   * Validate and sanitize usernames/display names
   */
  static validateDisplayName(name: string): {
    isValid: boolean;
    sanitized: string;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!name || typeof name !== 'string') {
      errors.push('Display name is required');
      return { isValid: false, sanitized: '', errors };
    }

    const trimmed = name.trim();

    if (trimmed.length === 0) {
      errors.push('Display name cannot be empty');
      return { isValid: false, sanitized: '', errors };
    }

    if (trimmed.length < 2) {
      errors.push('Display name must be at least 2 characters long');
      return { isValid: false, sanitized: '', errors };
    }

    if (trimmed.length > 50) {
      errors.push('Display name cannot exceed 50 characters');
      return { isValid: false, sanitized: '', errors };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(trimmed))) {
      errors.push('Display name contains suspicious content');
      return { isValid: false, sanitized: '', errors };
    }

    // Sanitize HTML and special characters
    const sanitized = DOMPurifyServer.sanitize(trimmed, { ALLOWED_TAGS: [] });

    return { isValid: true, sanitized, errors: [] };
  }

  /**
   * Validate and sanitize text content (comments, descriptions, etc.)
   */
  static validateTextContent(
    content: string,
    options: {
      maxLength?: number;
      minLength?: number;
      allowHtml?: boolean;
      allowedTags?: string[];
    } = {}
  ): { isValid: boolean; sanitized: string; errors: string[] } {
    const {
      maxLength = 10000,
      minLength = 0,
      allowHtml = false,
      allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a'],
    } = options;

    const errors: string[] = [];

    if (!content || typeof content !== 'string') {
      if (minLength > 0) {
        errors.push('Content is required');
        return { isValid: false, sanitized: '', errors };
      }
      return { isValid: true, sanitized: '', errors: [] };
    }

    const trimmed = content.trim();

    if (trimmed.length < minLength) {
      errors.push(`Content must be at least ${minLength} characters long`);
      return { isValid: false, sanitized: '', errors };
    }

    if (trimmed.length > maxLength) {
      errors.push(`Content cannot exceed ${maxLength} characters`);
      return { isValid: false, sanitized: '', errors };
    }

    // Check for malicious patterns
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
    ];

    if (maliciousPatterns.some((pattern) => pattern.test(trimmed))) {
      errors.push('Content contains potentially malicious code');
      return { isValid: false, sanitized: '', errors };
    }

    // Sanitize content
    let sanitized: string;
    if (allowHtml) {
      sanitized = DOMPurifyServer.sanitize(trimmed, {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: ['href', 'target', 'rel'],
      });
    } else {
      sanitized = DOMPurifyServer.sanitize(trimmed, { ALLOWED_TAGS: [] });
    }

    return { isValid: true, sanitized, errors: [] };
  }

  /**
   * Validate URL inputs
   */
  static validateURL(url: string): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];

    if (!url || typeof url !== 'string') {
      return { isValid: true, sanitized: '', errors: [] }; // URLs are optional
    }

    const trimmed = url.trim();

    if (trimmed.length === 0) {
      return { isValid: true, sanitized: '', errors: [] };
    }

    if (trimmed.length > 2048) {
      errors.push('URL is too long');
      return { isValid: false, sanitized: '', errors };
    }

    if (
      !validator.isURL(trimmed, {
        protocols: ['http', 'https'],
        require_protocol: true,
        require_valid_protocol: true,
      })
    ) {
      errors.push('Invalid URL format');
      return { isValid: false, sanitized: '', errors };
    }

    // Additional security checks
    if (trimmed.includes('<script') || trimmed.includes('javascript:')) {
      errors.push('URL contains suspicious content');
      return { isValid: false, sanitized: '', errors };
    }

    return { isValid: true, sanitized: trimmed, errors: [] };
  }

  /**
   * Validate file uploads
   */
  static validateFileUpload(
    file: {
      name: string;
      size: number;
      type: string;
    },
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): { isValid: boolean; errors: string[] } {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    } = options;

    const errors: string[] = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed`);
    }

    // Check for suspicious filenames
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i,
      /javascript:/i,
      /\.\./, // Double dots
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(file.name))) {
      errors.push('Filename contains suspicious content');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Sanitize SQL-like inputs (additional protection)
   */
  static sanitizeSQLInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove or escape potentially dangerous SQL characters
    return input
      .replace(/['";\\]/g, '') // Remove quotes, semicolons, backslashes
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*.*?\*\//g, '') // Remove block comments
      .trim();
  }

  /**
   * Check for common XSS patterns
   */
  static containsXSSPatterns(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /onmouseover=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<form/i,
      /document\./i,
      /window\./i,
      /eval\(/i,
      /alert\(/i,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }
}
