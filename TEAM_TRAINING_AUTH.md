# 👥 Team Training: Appwrite-Only Authentication

## Training Overview

**Duration**: 30 minutes
**Format**: Presentation + Hands-on Exercises
**Prerequisites**: Basic knowledge of React/Next.js

## 🎯 Learning Objectives

After this training, team members will be able to:

1. **Understand** the new Appwrite-only authentication system
2. **Implement** proper authentication in new features
3. **Debug** authentication-related issues
4. **Follow** security best practices
5. **Maintain** the authentication system

## 📋 Agenda

### Part 1: System Overview (10 minutes)

- Why we migrated to Appwrite-only
- Architecture comparison (before/after)
- Key components and their roles

### Part 2: Code Walkthrough (10 minutes)

- Authentication flow demonstration
- Key files and functions
- Common patterns and usage

### Part 3: Hands-on Exercises (10 minutes)

- Implementing protected routes
- Adding authentication to new features
- Debugging authentication issues

## 📖 Training Content

### 1. Authentication System Overview

#### Before (Dual System)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Appwrite   │    │   Custom    │    │ Application │
│   Auth      │◄──►│   JWT       │◄──►│   Logic     │
│             │    │ Sessions    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### After (Appwrite-Only)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Appwrite   │    │  Next.js    │    │ Application │
│   Auth      │◄──►│ Components  │◄──►│   Logic     │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Key Components

#### Client-Side (`hooks/useAppwriteAuth.ts`)

```typescript
const { user, login, logout, status } = useAppwriteAuth();

// Login user
await login(email, password);

// Check if authenticated
if (user) {
  // Show authenticated content
} else {
  // Show login form
}
```

#### Server-Side (`lib/auth.ts`)

```typescript
// In API routes
const user = await getCurrentUser(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

#### Profile Page (`app/profile/page.tsx`)

```typescript
// Client-side authentication check
const currentUser = await appwriteCurrentUser();
if (!currentUser) {
  router.push('/login?next=/profile');
  return;
}
```

### 3. Session Management

#### Session Cookies

- **Appwrite Session**: `a_session_${projectId}`
- **Automatic Management**: Appwrite handles creation, validation, expiry
- **Security**: HttpOnly, Secure, SameSite protection

#### Session Validation

```typescript
// Client-side
const user = await appwriteCurrentUser();

// Server-side
const user = await getCurrentUser(request);
```

## 🛠️ Hands-on Exercises

### Exercise 1: Protect an API Route

**Task**: Add authentication to a new API endpoint.

**Starting Code**:

```typescript
// app/api/my-feature/route.ts
export async function GET(request: NextRequest) {
  // Add authentication here
  return NextResponse.json({ data: 'my feature' });
}
```

**Solution**:

```typescript
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    data: 'my feature',
    user: user.displayName,
  });
}
```

### Exercise 2: Add Authentication to a Component

**Task**: Show different content based on authentication status.

**Starting Code**:

```typescript
export default function MyComponent() {
  return (
    <div>
      {/* Add authentication logic here */}
      <h1>My Component</h1>
    </div>
  );
}
```

**Solution**:

```typescript
'use client';

import { useAppwriteAuth } from '@/hooks/useAppwriteAuth';

export default function MyComponent() {
  const { user, loading } = useAppwriteAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to view this content</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>This is protected content</p>
    </div>
  );
}
```

### Exercise 3: Debug Authentication Issues

**Task**: Identify and fix authentication problems.

**Scenario**: User reports they can't access the profile page.

**Debugging Steps**:

1. Check browser console for errors
2. Verify Appwrite session cookie exists
3. Check network tab for failed requests
4. Review server logs for auth errors

## 🔒 Security Best Practices

### 1. API Route Protection

```typescript
// ✅ Good
const user = await getCurrentUser(request);
if (!user || !user.isActive) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ❌ Bad
// No authentication check
```

### 2. Permission Checking

```typescript
// ✅ Good
import { hasPermission, Permission } from '@/lib/permissions';

const canEdit = hasPermission(user.role, Permission.EDIT_OWN_PROFILE);

// ❌ Bad
if (user.role === 'admin') {
  /* custom logic */
}
```

### 3. Error Handling

```typescript
// ✅ Good
try {
  const user = await getCurrentUser(request);
} catch (error) {
  console.error('Auth error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

// ❌ Bad
const user = await getCurrentUser(request); // No error handling
```

## 🐛 Common Issues & Solutions

### Issue 1: "Session not found" errors

**Symptoms**: Users can't login or stay logged in

**Causes**:

- Appwrite configuration incorrect
- Environment variables missing
- Cookie domain mismatch

**Solutions**:

```bash
# Check environment variables
echo $NEXT_PUBLIC_APPWRITE_ENDPOINT
echo $NEXT_PUBLIC_APPWRITE_PROJECT_ID

# Verify Appwrite connectivity
curl -H "X-Appwrite-Project: $PROJECT_ID" "$ENDPOINT/health"
```

### Issue 2: Profile page not loading

**Symptoms**: Login works but profile page shows errors

**Causes**:

- Sync API failing
- Database connection issues
- User profile not created

**Solutions**:

```bash
# Check sync endpoint
curl -X POST /api/auth/sync -H "Content-Type: application/json" -b cookies.txt

# Check database
npm run db:health-check
```

### Issue 3: OAuth callback failures

**Symptoms**: OAuth login doesn't complete

**Causes**:

- Incorrect redirect URLs
- Appwrite OAuth configuration
- CORS issues

**Solutions**:

- Verify OAuth settings in Appwrite dashboard
- Check redirect URLs match exactly
- Review CORS configuration

## 📊 Monitoring Dashboard

### Key Metrics to Watch

#### Authentication Metrics

- **Login Success Rate**: Should be >95%
- **Session Creation Rate**: Track new user registrations
- **OAuth Completion Rate**: Track OAuth flow success

#### Performance Metrics

- **Auth Response Time**: Should be <500ms
- **Profile Sync Time**: Should be <1s
- **Session Validation Time**: Should be <100ms

#### Error Rates

- **401 Unauthorized**: Track authentication failures
- **500 Server Errors**: Track system failures
- **Sync Failures**: Track profile creation issues

### Log Monitoring

#### Important Log Patterns

```bash
# Authentication events
grep "Appwrite Auth:" /var/log/application.log

# Profile page events
grep "ProfilePage:" /var/log/application.log

# Sync API events
grep "auth/sync" /var/log/access.log
```

## 🚀 Development Workflow

### Adding New Features

#### 1. Plan Authentication Requirements

- Do you need user context?
- Are there permission requirements?
- Do you need to store user data?

#### 2. Implement Authentication

```typescript
// For API routes
const user = await getCurrentUser(request);

// For components
const { user } = useAppwriteAuth();
```

#### 3. Add Permission Checks

```typescript
const canAccess = hasPermission(user.role, Permission.REQUIRED_PERMISSION);
```

#### 4. Test Thoroughly

- Test with different user roles
- Test unauthenticated access
- Test error scenarios

### Code Review Checklist

#### Authentication

- [ ] API routes check for valid user
- [ ] Proper error responses for unauthorized access
- [ ] No sensitive data leakage in errors

#### Permissions

- [ ] Role-based access control implemented
- [ ] Permission constants used (not strings)
- [ ] Admin functions properly protected

#### Security

- [ ] No hardcoded credentials
- [ ] Proper error handling
- [ ] Input validation implemented

## 📞 Support & Resources

### Documentation

- **`APPWRITE_SESSION_GUIDE.md`**: Complete technical guide
- **`DEPLOYMENT_README.md`**: Deployment and monitoring
- **Appwrite Docs**: https://appwrite.io/docs

### Team Contacts

- **Authentication Expert**: [Name]
- **Backend Lead**: [Name]
- **Security Lead**: [Name]

### Emergency Procedures

1. Check system status dashboard
2. Review recent error logs
3. Contact on-call developer
4. Escalate to authentication expert if needed

---

**Training Completed**: [Date]
**Trainer**: [Name]
**Attendees**: [List]
**Next Training**: [Date - Quarterly Review]
