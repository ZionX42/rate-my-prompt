// Mock for jose library to avoid ESM issues in Jest
export class SignJWT {
  constructor(payload) {
    this.payload = payload;
  }

  setProtectedHeader(header) {
    this.header = header;
    return this;
  }

  setIssuedAt() {
    return this;
  }

  setExpirationTime(exp) {
    this.exp = exp;
    return this;
  }

  async sign(secret) {
    // Return a mock JWT token
    return 'mock.jwt.token';
  }
}

export async function jwtVerify(token, secret) {
  if (token === 'mock.jwt.token' || token === 'valid-token') {
    return {
      payload: {
        userId: 'user-123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };
  }
  throw new Error('Invalid token');
}
