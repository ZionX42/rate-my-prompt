# 🚀 Deployment & Production Readiness Guide

## Staging Deployment Checklist

### Pre-Deployment Steps

#### 1. Environment Configuration

```bash
# Verify environment variables
echo "Appwrite Endpoint: $NEXT_PUBLIC_APPWRITE_ENDPOINT"
echo "Appwrite Project ID: $NEXT_PUBLIC_APPWRITE_PROJECT_ID"
echo "Database URL: $DATABASE_URL"
echo "Node Environment: $NODE_ENV"
```

#### 2. Database Migration

```bash
# Ensure database is up to date
npm run db:migrate
npm run db:seed  # If applicable
```

#### 3. Build Testing

```bash
# Test production build
npm run build
npm run start  # Test production server locally
```

### Deployment Commands

#### Using Vercel (Recommended)

```bash
# Deploy to staging
vercel --prod=false

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint.com/v1
# NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
# DATABASE_URL=your-database-connection-string
# NODE_ENV=production
```

#### Using Docker

```bash
# Build and deploy
docker build -t your-app .
docker run -p 3000:3000 your-app
```

## 🧪 Testing Procedures

### Authentication Flow Testing

#### Test Case 1: New User Registration

1. Navigate to `https://your-staging-domain.com/login`
2. Click "Sign up" in the modal
3. Enter email and password
4. Verify account creation and automatic login
5. Check profile page loads with new user data

#### Test Case 2: Existing User Login

1. Navigate to `https://your-staging-domain.com/profile`
2. Verify redirect to login page
3. Enter valid credentials
4. Verify redirect back to profile page
5. Confirm user data loads correctly

#### Test Case 3: OAuth Login

1. Navigate to `https://your-staging-domain.com/profile`
2. Click Google/GitHub login
3. Complete OAuth flow
4. Verify profile creation and data loading

#### Test Case 4: Session Persistence

1. Login to the application
2. Refresh the page
3. Verify session persists
4. Close browser and reopen
5. Verify login state maintained

#### Test Case 5: Admin Route Protection

1. Try accessing `https://your-staging-domain.com/admin`
2. Verify redirect to login (if not admin)
3. Login as admin user
4. Verify access to admin routes

### Error Scenario Testing

#### Network Failures

- Disable network connectivity
- Try to access protected routes
- Verify graceful error handling

#### Invalid Credentials

- Enter wrong email/password
- Verify proper error messages
- Check no sensitive data leakage

#### Session Expiry

- Login and wait for session expiry
- Try to access protected resources
- Verify redirect to login

## 📊 Monitoring Setup

### Application Monitoring

#### 1. Error Tracking (Sentry/ReTool)

```javascript
// Add to your error boundaries
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: 'staging',
  tracesSampleRate: 1.0,
});
```

#### 2. Performance Monitoring

```bash
# Install monitoring tools
npm install @vercel/analytics
npm install @vercel/speed-insights
```

### Authentication-Specific Monitoring

#### Log Aggregation

```bash
# Key logs to monitor
grep "Appwrite Auth:" /var/log/application.log
grep "ProfilePage:" /var/log/application.log
grep "AuthModalProvider:" /var/log/application.log
```

#### Metrics to Track

- Authentication success/failure rates
- Session creation frequency
- Profile sync performance
- OAuth callback completion rates

### Alert Setup

#### Critical Alerts

- Authentication service unavailable
- High failure rate in auth flows
- Session sync failures
- Database connectivity issues

#### Warning Alerts

- Slow authentication responses
- High number of session validations
- Unusual OAuth callback patterns

## 📚 Documentation Updates

### Update README.md

```markdown
# Authentication System

This application uses **Appwrite-only authentication** for all user management.

## Features

- OAuth login (Google, GitHub)
- Email/password authentication
- Role-based permissions (User/Moderator/Admin)
- Automatic session management
- Profile management

## Quick Start

1. Configure Appwrite credentials in environment variables
2. Deploy to your hosting platform
3. Users can register/login via the auth modal
4. Access profile at `/profile`
5. Admin functions at `/admin`
```

### API Documentation Updates

Update your API documentation to reflect the new authentication system:

```typescript
// Example API usage
const response = await fetch('/api/protected-route', {
  credentials: 'include', // Important for Appwrite sessions
  headers: {
    'Content-Type': 'application/json',
  },
});

if (response.status === 401) {
  // Redirect to login
  window.location.href = '/login';
}
```

## 👥 Team Training Materials

### Training Presentation Slides

#### Slide 1: Authentication System Overview

- **Before**: Dual JWT + Appwrite system
- **After**: Appwrite-only authentication
- **Benefits**: Simpler, more secure, easier maintenance

#### Slide 2: Key Changes

- Removed `SessionManager` class
- Updated all API routes to use `getCurrentUser()`
- Profile page now client-side component
- Middleware uses Appwrite session validation

#### Slide 3: Development Workflow

```typescript
// New authentication pattern
const user = await getCurrentUser(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

#### Slide 4: Debugging Guide

- Check browser for `a_session_${projectId}` cookies
- Monitor `/api/auth/sync` endpoint
- Review authentication logs
- Use browser dev tools for session inspection

### Code Examples for Team

#### 1. Protecting API Routes

```typescript
// lib/auth.ts
export async function getCurrentUser(request: NextRequest): Promise<User | null>;

// Usage in API routes
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Proceed with authenticated request
}
```

#### 2. Client-Side Authentication

```typescript
// hooks/useAppwriteAuth.ts
const { user, login, logout, status } = useAppwriteAuth();

// Profile page pattern
const currentUser = await appwriteCurrentUser();
if (!currentUser) {
  router.push('/login?next=' + currentPath);
}
```

#### 3. Permission Checking

```typescript
// lib/permissions.ts
import { hasPermission, Permission } from '@/lib/permissions';

const canEdit = hasPermission(user.role, Permission.EDIT_OWN_PROFILE);
const canManageUsers = hasPermission(user.role, Permission.MANAGE_USERS);
```

## 🔧 Maintenance Procedures

### Regular Maintenance Tasks

#### 1. Dependency Updates

```bash
# Update Appwrite SDK
npm update appwrite

# Update Next.js and related packages
npm update next react

# Security updates
npm audit fix
```

#### 2. Performance Monitoring

- Monitor authentication response times
- Check database query performance
- Review session cookie settings

#### 3. Security Audits

- Regular dependency vulnerability scans
- Appwrite configuration reviews
- Session management audits

### Troubleshooting Common Issues

#### Issue: Users can't login

**Diagnosis**:

1. Check Appwrite service status
2. Verify environment variables
3. Check browser console for errors
4. Review server logs for auth failures

**Resolution**:

```bash
# Check Appwrite connectivity
curl -H "X-Appwrite-Project: $PROJECT_ID" "$APPWRITE_ENDPOINT/health"

# Verify environment variables
echo $NEXT_PUBLIC_APPWRITE_ENDPOINT
echo $NEXT_PUBLIC_APPWRITE_PROJECT_ID
```

#### Issue: Sessions not persisting

**Diagnosis**:

1. Check cookie configuration
2. Verify domain settings
3. Review session duration settings

**Resolution**:

- Check Appwrite dashboard session settings
- Verify cookie domain configuration
- Review CORS settings

#### Issue: Profile page not loading

**Diagnosis**:

1. Check authentication flow logs
2. Verify user profile creation
3. Check database connectivity

**Resolution**:

```bash
# Check auth sync logs
grep "Appwrite Auth:" /var/log/application.log

# Verify database connection
npm run db:health-check
```

## 🚀 Production Deployment

### Final Production Checklist

#### Security

- [ ] Appwrite production instance configured
- [ ] Environment variables set correctly
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled

#### Performance

- [ ] Database indexes optimized
- [ ] CDN configured for static assets
- [ ] Image optimization enabled
- [ ] Bundle analysis completed

#### Monitoring

- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring enabled
- [ ] Log aggregation set up
- [ ] Alert thresholds configured

#### Documentation

- [ ] API documentation updated
- [ ] Authentication guide distributed
- [ ] Team training completed
- [ ] Runbooks created

### Rollback Plan

If issues occur in production:

1. **Immediate Actions**:

   ```bash
   # Enable maintenance mode
   echo "MAINTENANCE_MODE=true" >> .env.local

   # Rollback to previous deployment
   vercel rollback
   ```

2. **Investigation**:
   - Check error logs
   - Review authentication metrics
   - Test staging environment

3. **Communication**:
   - Notify affected users
   - Update status page
   - Inform development team

## 📞 Support Contacts

### Development Team

- **Authentication Lead**: [Name/Contact]
- **Backend Developer**: [Name/Contact]
- **Frontend Developer**: [Name/Contact]

### External Support

- **Appwrite Support**: https://appwrite.io/support
- **Hosting Platform**: [Vercel/Netlify/DigitalOcean] support

### Emergency Contacts

- **On-call Developer**: [Phone/Email]
- **System Administrator**: [Phone/Email]

---

**Last Updated**: [Current Date]
**Version**: 2.0.0 (Appwrite-Only Authentication)
**Previous Version**: 1.0.0 (Dual JWT + Appwrite)
