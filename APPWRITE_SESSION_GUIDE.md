# Appwrite Session Management Guide

## Overview

This application uses **Appwrite-only authentication**, eliminating the previous dual JWT + Appwrite system. All authentication flows now rely exclusively on Appwrite's native session management.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Appwrite      │    │   Next.js       │    │   Application   │
│  Authentication │    │   Components    │    │     Logic       │
│                 │    │                 │    │                 │
│ • OAuth Login   │◄──►│ • Profile Page  │◄──►│ • API Routes    │
│ • Email/Pass    │    │ • Auth Modal    │    │ • Middleware    │
│ • Sessions      │    │ • Auth Hook     │    │ • Permissions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Session Management Components

### 1. Client-Side Authentication (`hooks/useAppwriteAuth.ts`)

**Purpose**: Manages authentication state in React components

**Key Functions**:

```typescript
// Login with email/password
await login(email: string, password: string): Promise<void>

// OAuth login
await account.createOAuth2Session(provider, successUrl, failureUrl)

// Get current user
const currentUser = await appwriteCurrentUser()

// Logout
await logout(): Promise<void>
```

**Usage Example**:

```typescript
const { user, login, logout, status } = useAppwriteAuth();

const handleLogin = async () => {
  try {
    await login(email, password);
    // Redirect or update UI
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 2. Server-Side Session Validation (`lib/auth.ts`)

**Purpose**: Validates Appwrite sessions in API routes and middleware

**Key Functions**:

```typescript
// Get current user from request
export async function getCurrentUser(request: NextRequest): Promise<User | null>;

// Check if user has admin role
export async function isCurrentUserAdmin(request: NextRequest): Promise<boolean>;

// Check specific permission
export async function currentUserHasPermission(
  permission: string,
  request: NextRequest
): Promise<boolean>;
```

**Usage in API Routes**:

```typescript
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated, proceed with request
  return NextResponse.json({ data: 'protected resource' });
}
```

### 3. Session Sync API (`app/api/auth/sync/route.ts`)

**Purpose**: Syncs Appwrite account with application user profile

**Process**:

1. Validates Appwrite session cookie (`a_session_${projectId}`)
2. Fetches user account from Appwrite
3. Creates or updates user profile in database
4. Returns user profile data

**Automatic Triggers**:

- After successful OAuth callback
- After form-based login
- Manual sync when needed

### 4. Middleware Protection (`middleware.ts`)

**Purpose**: Protects routes using Appwrite session validation

**Admin Route Protection**:

```typescript
if (request.nextUrl.pathname.startsWith('/admin')) {
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const appwriteSessionCookie = request.cookies.get(`a_session_${projectId}`)?.value;

  if (!appwriteSessionCookie) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}
```

## Session Lifecycle

### 1. Session Creation

**OAuth Flow**:

```
User clicks OAuth provider → Appwrite creates session → OAuth callback → Sync API → Profile created
```

**Email/Password Flow**:

```
User submits form → Appwrite creates session → Sync API → Profile created → Redirect to destination
```

### 2. Session Validation

**Client-Side**:

```typescript
const currentUser = await appwriteCurrentUser();
if (currentUser) {
  // User is authenticated
} else {
  // Redirect to login
}
```

**Server-Side**:

```typescript
const user = await getCurrentUser(request);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 3. Session Cleanup

**Logout**:

```typescript
// Client-side
await logout(); // Deletes Appwrite session

// Server-side cleanup happens automatically when session expires
```

## Security Features

### 1. Cookie Configuration

Appwrite automatically configures secure session cookies:

- **HttpOnly**: Prevents XSS access
- **Secure**: HTTPS only in production
- **SameSite**: CSRF protection
- **Domain/Path**: Configurable scope

### 2. Session Expiration

- **Default**: 24 hours (configurable in Appwrite dashboard)
- **Refresh**: Automatic refresh on activity
- **Absolute**: 7 days maximum (configurable)

### 3. Permission System

**Role-Based Access Control**:

```typescript
import { hasPermission, Permission } from '@/lib/permissions';

// Check if user can perform action
const canEdit = hasPermission(user.role, Permission.EDIT_OWN_PROFILE);
const canManageUsers = hasPermission(user.role, Permission.MANAGE_USERS);
```

**Available Roles**:

- `USER`: Basic user permissions
- `MODERATOR`: Enhanced permissions
- `ADMIN`: Full administrative access

## Best Practices

### 1. Error Handling

```typescript
try {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
} catch (error) {
  console.error('Auth error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### 2. Client-Side State Management

```typescript
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  checkAuth();
}, []);

const checkAuth = async () => {
  try {
    const currentUser = await appwriteCurrentUser();
    setUser(currentUser);
  } catch (error) {
    console.error('Auth check failed:', error);
  } finally {
    setLoading(false);
  }
};
```

### 3. Route Protection

**Client-Side** (Profile Page):

```typescript
if (!user) {
  router.push(`/login?next=${encodeURIComponent(currentPath)}`);
  return;
}
```

**Server-Side** (API Routes):

```typescript
const user = await getCurrentUser(request);
if (!user || !user.isActive) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Debugging

### 1. Check Session Cookies

**Browser DevTools**:

1. Go to Application → Cookies
2. Look for `a_session_${projectId}` cookie
3. Verify cookie is present and not expired

**Server-Side Logging**:

```typescript
console.log('Session cookie present:', !!request.cookies.get(`a_session_${projectId}`));
```

### 2. Test Authentication Flow

**Manual Testing**:

1. Clear all cookies for the domain
2. Navigate to `/profile`
3. Verify redirect to login
4. Complete authentication
5. Verify redirect back to profile
6. Check browser console for errors

### 3. Common Issues

**Session Not Found**:

- Check if Appwrite project ID is correct
- Verify Appwrite endpoint configuration
- Ensure cookies are not being blocked

**Sync Failures**:

- Check database connectivity
- Verify user creation permissions
- Check Appwrite account data

**Permission Errors**:

- Verify user role assignment
- Check permission constants
- Validate role-based logic

## Configuration

### Environment Variables

```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-appwrite-endpoint.com/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id

# Database
DATABASE_URL=your-database-connection-string
```

### Appwrite Dashboard Settings

1. **Authentication**:
   - Enable desired OAuth providers
   - Configure email/password settings
   - Set session duration

2. **Security**:
   - Configure CORS settings
   - Set up custom domains
   - Configure session security

3. **Database**:
   - Ensure user collection exists
   - Configure proper permissions
   - Set up indexes for performance

## Migration from Dual System

If migrating from the previous JWT + Appwrite system:

1. **Remove JWT Dependencies**:
   - Delete `SessionManager` class
   - Remove JWT creation/verification
   - Clean up custom session cookies

2. **Update All References**:
   - Replace `SessionManager.getCurrentSession()` with `getCurrentUser(request)`
   - Update permission checking logic
   - Remove JWT cookie handling

3. **Test Thoroughly**:
   - Test all authentication flows
   - Verify session persistence
   - Check permission enforcement

## Performance Considerations

### 1. Session Validation

- Appwrite handles session validation efficiently
- Client-side checks are cached appropriately
- Server-side validation happens per request

### 2. Database Queries

- User profile lookup is optimized
- Consider caching for frequently accessed profiles
- Use proper database indexes

### 3. Client-Side Optimization

- Minimize authentication checks
- Use React context for auth state
- Implement proper loading states

This Appwrite-only authentication system provides a clean, maintainable, and secure foundation for user authentication and authorization in your Next.js application.
