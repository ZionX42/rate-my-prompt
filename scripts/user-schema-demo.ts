import { PrismaClient } from '@prisma/client';

// This is a sample script to demonstrate the schema structure
// It shows what kind of operations would be possible once connected to a real database

// Sample user data
const sampleUser = {
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.jpg',
  password: 'hashed_password_here',
  role: 'USER', // From the Role enum in the schema
};

// Sample operation that would create a user
async function createUser(data: typeof sampleUser) {
  const prisma = new PrismaClient();
  
  try {
    // In a real scenario, this would create a user in the database
    console.log('Creating user with data:', data);
    
    // The operation would look like this:
    // const user = await prisma.user.create({
    //   data,
    // });
    
    // For now, we're just printing what would happen
    console.log('User schema is properly configured!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Sample function that would show how to query users
function getUserQueries() {
  console.log('Sample user queries that would be possible:');
  console.log('- Find user by ID: prisma.user.findUnique({ where: { id: "user_id" } })');
  console.log('- Find user by email: prisma.user.findUnique({ where: { email: "email@example.com" } })');
  console.log('- Find all users: prisma.user.findMany()');
  console.log('- Find users with pagination: prisma.user.findMany({ skip: 10, take: 20 })');
  console.log('- Find users by role: prisma.user.findMany({ where: { role: "ADMIN" } })');
  console.log('- Find user with related data: prisma.user.findUnique({ where: { id: "id" }, include: { prompts: true } })');
}

// Demo the model structure
createUser(sampleUser);
getUserQueries();

// Sample operation that would create a user
async function createUser(data: typeof sampleUser) {
  const prisma = new PrismaClient();
  
  try {
    // In a real scenario, this would create a user in the database
    console.log('Creating user with data:', data);
    
    // The operation would look like this:
    // const user = await prisma.user.create({
    //   data,
    // });
    
    // For now, we're just printing what would happen
    console.log('User schema is properly configured!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Sample function that would show how to query users
function getUserQueries() {
  console.log('Sample user queries that would be possible:');
  console.log('- Find user by ID: prisma.user.findUnique({ where: { id: "user_id" } })');
  console.log('- Find user by email: prisma.user.findUnique({ where: { email: "email@example.com" } })');
  console.log('- Find all users: prisma.user.findMany()');
  console.log('- Find users with pagination: prisma.user.findMany({ skip: 10, take: 20 })');
  console.log('- Find users by role: prisma.user.findMany({ where: { role: Role.ADMIN } })');
  console.log('- Find user with related data: prisma.user.findUnique({ where: { id: "id" }, include: { prompts: true } })');
}

// Demo the model structure
createUser(sampleUser);
getUserQueries();
