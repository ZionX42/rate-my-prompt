# Security Implementation Guide

This document outlines the comprehensive security measures implemented in the application to protect against common web vulnerabilities.

## Overview

The application implements defense-in-depth security measures including:

- Input sanitization and validation
- Security headers via Next.js middleware
- XSS prevention
- SQL/NoSQL injection protection
- Command injection protection
- Malicious pattern detection

## Security Headers

### Implementation

Security headers are implemented in `middleware.ts` and applied globally to all routes.

### Headers Applied

#### Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self' https://api.sentry.io https://cloud.appwrite.io;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

#### Additional Security Headers

- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-XSS-Protection**: `1; mode=block` - Legacy XSS protection
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Permissions-Policy**: `camera=(), microphone=(), geolocation=()` - Disables unnecessary APIs
- **Strict-Transport-Security**: `max-age=31536000; includeSubDomains; preload` (Production only)

## Input Sanitization

### Core Sanitization Library

Location: `lib/security/sanitize.ts`

### Available Functions

#### General Text Sanitization

```typescript
sanitizeText(input: string, options?: SanitizeOptions): string
```

- Trims whitespace
- Normalizes whitespace
- Escapes or sanitizes HTML
- Enforces length limits
- Handles malicious content

#### Specialized Sanitization

- `sanitizeEmail(email: string)`: Email normalization and validation
- `sanitizeUrl(url: string)`: URL validation with protocol restrictions
- `sanitizeDisplayName(name: string)`: User display name sanitization
- `sanitizeBio(bio: string)`: User biography sanitization
- `sanitizePromptContent(content: string)`: Prompt content with allowed HTML
- `sanitizeCommentContent(content: string)`: Comment content (plain text only)
- `sanitizeSearchQuery(query: string)`: Search input sanitization
- `sanitizeTags(tags: string[])`: Tag array sanitization

### Malicious Pattern Detection

```typescript
detectMaliciousPatterns(input: string): boolean
```

Detects:

- Script injection attempts
- Event handler injection
- SQL injection patterns
- Command injection attempts
- Path traversal attempts

## Model-Level Security

### Enhanced Model Sanitization

#### Prompt Model (`lib/models/prompt.ts`)

```typescript
export function sanitizeNewPrompt(input: NewPromptInput): NewPromptInput;
```

- Validates against malicious patterns
- Sanitizes title, content, and description
- Limits tag count and content
- Throws error on detected threats

#### Comment Model (`lib/models/comment.ts`)

```typescript
export function sanitizeCreateComment(input: CreateCommentPayload): CreateCommentPayload;
export function sanitizeUpdateComment(input: UpdateCommentPayload): UpdateCommentPayload;
```

- Strips all HTML from comments
- Detects malicious patterns
- Enforces content length limits

#### User Model (`lib/models/user.ts`)

```typescript
export function sanitizeProfileUpdate(input: ProfileUpdateInput): ProfileUpdateInput;
```

- Sanitizes display names and bios
- Validates avatar URLs
- Prevents malicious profile content

## API Security

### Content-Type Validation

```typescript
requireJson(req: NextRequest | Request)
```

- Enforces `application/json` content type
- Prevents content type confusion attacks

### Rate Limiting

```typescript
simpleRateLimit(req: NextRequest, limit?: number, windowMs?: number)
```

- IP-based rate limiting
- Configurable limits and time windows
- Logging of rate limit violations

## Vulnerability Prevention

### Cross-Site Scripting (XSS)

**Prevention Methods:**

- HTML entity encoding for user input
- DOMPurify sanitization for HTML content
- Content Security Policy headers
- Input validation with pattern detection

**Safe HTML Tags Allowed:**

- `<b>`, `<i>`, `<em>`, `<strong>`, `<code>`, `<p>`, `<br>`
- No attributes allowed
- No script tags or event handlers

### SQL/NoSQL Injection

**Prevention Methods:**

- Parameterized queries (Prisma/Appwrite)
- Input validation and sanitization
- Pattern detection for SQL keywords
- Strict type checking

### Command Injection

**Prevention Methods:**

- Pattern detection for command separators
- Input sanitization
- No direct system command execution
- Validation of all user inputs

### Path Traversal

**Prevention Methods:**

- Pattern detection for `../` and `..\`
- Input validation
- No direct file system access with user input

## Testing

### Security Test Suite

Location: `__tests__/security/sanitize.test.ts`

**Test Coverage:**

- XSS prevention (14 different payloads)
- SQL injection prevention (11 different payloads)
- Command injection prevention (7 different payloads)
- Input sanitization edge cases
- Malicious pattern detection

### Running Security Tests

```bash
npm test __tests__/security/sanitize.test.ts
```

## Configuration

### Environment Variables

```env
# Security headers only apply in production
NODE_ENV=production

# CSP can be customized per environment
```

### DOMPurify Configuration

```typescript
DOMPurify.setConfig({
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'p', 'br'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
});
```

## Best Practices

### Input Validation

1. **Validate at the boundary** - Sanitize all inputs at API entry points
2. **Use allowlists** - Define what's allowed rather than what's blocked
3. **Layer validation** - Validate at multiple levels (client, API, database)
4. **Fail securely** - Reject suspicious input rather than attempting to clean

### Content Handling

1. **Escape by default** - Use HTML entity encoding unless HTML is explicitly needed
2. **Sanitize HTML** - Use DOMPurify for any user-generated HTML content
3. **Validate URLs** - Ensure URLs use safe protocols and are well-formed
4. **Limit content length** - Prevent resource exhaustion attacks

### Error Handling

1. **Don't leak information** - Generic error messages for security failures
2. **Log security events** - All security violations should be logged
3. **Fail closed** - When in doubt, deny access or reject input

## Monitoring and Alerts

### Security Event Logging

All security-related events are logged through the structured logging system:

```typescript
logWarn('Malicious pattern detected', {
  input: sanitizedInput,
  pattern: 'xss_attempt',
  userId: req.userId,
});
```

### Monitoring Checklist

- [ ] Monitor for repeated malicious pattern detection
- [ ] Track rate limiting violations
- [ ] Watch for CSP violations (if reporting is enabled)
- [ ] Monitor authentication failures
- [ ] Track unusual input patterns

## Security Checklist

### Implementation Checklist

- [x] Security headers implemented via middleware
- [x] Input sanitization for all user inputs
- [x] XSS prevention measures
- [x] SQL injection prevention
- [x] Command injection prevention
- [x] Malicious pattern detection
- [x] Comprehensive security tests
- [x] Rate limiting implementation

### Deployment Checklist

- [ ] Security headers active in production
- [ ] CSP policy reviewed and tested
- [ ] Error handling doesn't leak sensitive info
- [ ] Logging captures security events
- [ ] Rate limiting configured appropriately
- [ ] Security monitoring alerts configured

### Regular Security Tasks

- [ ] Review and update CSP policy
- [ ] Update malicious pattern detection rules
- [ ] Review security logs regularly
- [ ] Test security measures with new attack vectors
- [ ] Update dependencies for security patches
- [ ] Conduct periodic security audits

## Incident Response

### If Security Vulnerability is Discovered

1. **Immediate assessment** - Determine scope and impact
2. **Containment** - Implement temporary fixes if possible
3. **Investigation** - Review logs for exploitation attempts
4. **Remediation** - Implement permanent fix
5. **Testing** - Verify fix doesn't break functionality
6. **Communication** - Notify stakeholders as appropriate
7. **Post-incident review** - Update security measures

### Security Contact

For security-related issues, follow responsible disclosure practices and contact the development team through secure channels.

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
