import { PrismaClient } from '@prisma/client';

// Test the database connection and schema
async function testConnection() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing Prisma connection...');
    // Basic connection test
    await prisma.$connect();
    console.log('Database connection successful!');

    // Clean up
    await prisma.$disconnect();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Database connection error:', error);
    await prisma.$disconnect();
  }
}

testConnection();
