// Import PrismaClient from the generated directory
import { PrismaClient } from '../generated/prisma';

// Create a new Prisma client instance
const prisma = new PrismaClient();

// Export the Prisma client as the default export
export default prisma;

// Also export PrismaClient and all Prisma enums for use in other files
export * from '../generated/prisma'; 