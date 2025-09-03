# Logging and Monitoring Setup

This document outlines the logging and monitoring infrastructure implemented in the application.

## Overview

The application uses structured logging with Winston and error tracking with Sentry to provide comprehensive monitoring and debugging capabilities.

## Logging

### Configuration

Logging is configured in `lib/logger.ts` and supports multiple log levels:

- **error**: Critical errors that need immediate attention
- **warn**: Warning messages for potential issues
- **info**: General information about application flow
- **debug**: Detailed debugging information

### Log Levels by Environment

- **Development**: `debug` (all logs)
- **Production**: `info` (info, warn, error)
- **Custom**: Set via `LOG_LEVEL` environment variable

### Usage

```typescript
import { logError, logWarn, logInfo, logDebug } from '@/lib/logger';

// Basic logging
logError('Something went wrong', error);
logWarn('This might be a problem');
logInfo('User logged in');
logDebug('Processing step completed');

// Structured logging with metadata
logUserAction('prompt_created', userId, {
  promptId: 'prompt_123',
  category: 'coding',
});

logApiRequest('POST', '/api/prompts', userId);
logDatabaseOperation('insert', 'prompts', { recordId: 'prompt_123' });
```

### Log Formats

#### Development

Console output with colors and simple formatting for easy reading.

#### Production

- JSON format for log aggregation
- File output to `logs/error.log` and `logs/combined.log`
- Structured with timestamps and service metadata

## Error Tracking

### Sentry Integration

Sentry is configured for comprehensive error tracking and performance monitoring:

**Configuration Files:**

- `sentry.client.config.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration
- `sentry.edge.config.ts` - Edge runtime configuration

**Features:**

- Automatic error capture and stack traces
- Performance monitoring (10% sample rate in production)
- Session replay for debugging (10% of sessions, 100% with errors)
- Release tracking and source maps

### Environment Variables

```bash
# Required for Sentry
SENTRY_DSN=your_sentry_dsn_here

# Optional - enable Sentry in development
SENTRY_ENABLE_DEV=false

# Logging level
LOG_LEVEL=info
```

## API Request Logging

All API routes automatically log requests and responses using middleware:

```typescript
import { logRequest } from '@/lib/api/middleware';

export async function POST(req: NextRequest) {
  // Log incoming request
  logRequest(req, userId);

  // ... route logic
}
```

**Logged Information:**

- HTTP method and URL
- User ID (when available)
- User agent and IP address
- Request timestamp
- Response status and duration

## Business Logic Logging

Key business operations are logged for audit trails:

### User Actions

```typescript
logUserAction('prompt_created', userId, {
  promptId: createdPrompt._id,
  title: createdPrompt.title,
  category: createdPrompt.category,
});
```

### Database Operations

```typescript
logDatabaseOperation('insert', 'prompts', {
  recordId: promptId,
  operation: 'create',
});
```

## Error Handling Integration

The `lib/api/responses.ts` module automatically integrates with both logging systems:

```typescript
export function internalError(err: unknown) {
  // Structured logging
  logError('Internal server error', err, {
    type: 'internal_error',
    timestamp: new Date().toISOString(),
  });

  // Send to Sentry
  Sentry.captureException(err);

  return NextResponse.json(formatErrorBody('Internal Server Error'), { status: 500 });
}
```

## Log Files (Production)

When running in production, logs are written to:

- `logs/error.log` - Error level logs only
- `logs/combined.log` - All log levels

Ensure the `logs/` directory exists and has appropriate write permissions.

## Monitoring Dashboard

### Sentry Dashboard

Access your Sentry dashboard to monitor:

- Error rates and trends
- Performance metrics
- User impact analysis
- Release comparisons

### Log Analysis

For production environments, consider integrating with log aggregation services:

- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana + Loki
- CloudWatch (AWS)
- Google Cloud Logging

## Testing

### Testing with Logging

The logging system is designed to be test-friendly:

```typescript
// In tests, logs go to console only
process.env.NODE_ENV = 'test';

// Sentry is disabled by default in development/test
// unless SENTRY_ENABLE_DEV=true
```

### Verifying Logging

Run tests to verify logging behavior:

```bash
npm test
```

## Best Practices

### When to Log

- **Error Level**: Unhandled exceptions, critical failures
- **Warn Level**: Rate limiting, validation warnings, deprecated usage
- **Info Level**: User actions, API requests, business operations
- **Debug Level**: Internal state changes, processing steps

### Structured Logging

Always include relevant context:

```typescript
logError('Database connection failed', error, {
  database: 'prompts',
  operation: 'connect',
  retryCount: 3,
});
```

### Security

- Never log sensitive information (passwords, tokens, PII)
- Sanitize user input before logging
- Use log levels appropriately to avoid information leakage

## Troubleshooting

### Common Issues

1. **Logs not appearing**: Check `LOG_LEVEL` environment variable
2. **Sentry not receiving errors**: Verify `SENTRY_DSN` is set correctly
3. **File logging errors**: Ensure `logs/` directory exists with write permissions

### Debug Mode

Enable debug logging temporarily:

```bash
LOG_LEVEL=debug npm run dev
```

## Integration Checklist

- [ ] Environment variables configured
- [ ] Sentry DSN set up
- [ ] Log directory created (production)
- [ ] API routes using request logging
- [ ] Error boundaries implemented
- [ ] Business logic audit trails added
- [ ] Monitoring dashboard configured
- [ ] Team access to logs and alerts set up
