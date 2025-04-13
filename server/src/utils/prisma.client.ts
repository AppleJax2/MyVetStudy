import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient({
    // Optional: Configure logging or other options here
    // log: ['query', 'info', 'warn', 'error'],
});

export default prisma; 