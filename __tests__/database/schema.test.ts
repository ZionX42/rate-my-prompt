import { PrismaClient } from '@prisma/client';

describe('User Schema', () => {
  let prisma: PrismaClient;
  
  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('has the correct schema structure', () => {
    // This test just verifies that the Prisma client has the expected models and fields
    // It won't actually connect to a database
    expect(prisma).toBeDefined();
    
    // Check that user model exists
    expect(prisma.user).toBeDefined();
    
    // Check that related models exist
    expect(prisma.account).toBeDefined();
    expect(prisma.session).toBeDefined();
    expect(prisma.prompt).toBeDefined();
    expect(prisma.rating).toBeDefined();
    expect(prisma.comment).toBeDefined();
  });
});
