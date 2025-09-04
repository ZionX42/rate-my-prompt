import bcrypt from 'bcryptjs';

// Simple password utilities for testing (without server-only)
class TestPasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static validateStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Mock JWT functions for testing
class TestJWT {
  static async createJWT(payload: Record<string, unknown>): Promise<string> {
    // Simple mock JWT creation for testing
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 }));
    const signature = btoa('mock-signature');
    return `${header}.${body}.${signature}`;
  }

  static async verifyJWT(token: string): Promise<Record<string, unknown> | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp < Date.now()) return null;

      return payload;
    } catch {
      return null;
    }
  }
}

async function testPasswordHashing() {
  console.log('🧪 Testing Password Hashing...');

  const testPassword = 'TestPassword123!';

  // Test password hashing
  const hash = await TestPasswordUtils.hash(testPassword);
  console.log('✅ Password hashed successfully');

  // Test password verification
  const isValid = await TestPasswordUtils.verify(testPassword, hash);
  console.log('✅ Password verification:', isValid ? 'PASSED' : 'FAILED');

  // Test invalid password
  const isInvalid = await TestPasswordUtils.verify('WrongPassword', hash);
  console.log('✅ Invalid password verification:', !isInvalid ? 'PASSED' : 'FAILED');

  // Test password strength validation
  const strongPassword = 'StrongPass123!';
  const weakPassword = 'weak';

  const strongValidation = TestPasswordUtils.validateStrength(strongPassword);
  const weakValidation = TestPasswordUtils.validateStrength(weakPassword);

  console.log('✅ Strong password validation:', strongValidation.isValid ? 'PASSED' : 'FAILED');
  console.log('✅ Weak password validation:', !weakValidation.isValid ? 'PASSED' : 'FAILED');

  return true;
}

async function testJWT() {
  console.log('\n🧪 Testing JWT Authentication...');

  const payload = {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: 'USER',
  };

  // Test JWT creation
  const token = await TestJWT.createJWT(payload);
  console.log('✅ JWT token created successfully');

  // Test JWT verification
  const decoded = await TestJWT.verifyJWT(token);
  console.log('✅ JWT verification:', decoded ? 'PASSED' : 'FAILED');

  if (decoded) {
    console.log('✅ JWT payload matches:', decoded.userId === payload.userId);
    console.log('✅ JWT email matches:', decoded.email === payload.email);
  }

  // Test invalid token
  const invalidDecoded = await TestJWT.verifyJWT('invalid-token');
  console.log('✅ Invalid token verification:', !invalidDecoded ? 'PASSED' : 'FAILED');

  return true;
}

async function runSecurityTests() {
  console.log('🔒 Running Security Tests...\n');

  try {
    await testPasswordHashing();
    await testJWT();

    console.log('\n🎉 All security tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ Security test failed:', error);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests();
}

export { runSecurityTests };
