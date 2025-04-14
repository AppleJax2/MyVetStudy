import { Request, Response } from 'express';
import prisma from '../utils/prisma'; // Import shared Prisma instance
import { hashPassword, comparePasswords, generateToken } from '../utils/auth.utils';
import { UserRole } from '@prisma/client'; // Correct import path for Prisma Client enums

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Ensure req.body has the correct type or use type assertion if necessary
    // (Assuming body-parser or express.json middleware is used)
    const { email, password, firstName, lastName, role: roleString, practiceId } = req.body as { 
      email?: string; 
      password?: string; 
      firstName?: string; 
      lastName?: string; 
      role?: string; 
      practiceId?: string; 
    };

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !roleString) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate the role string against the UserRole enum
    const role = UserRole[roleString as keyof typeof UserRole];
    if (!role) {
      return res.status(400).json({ message: `Invalid role provided: ${roleString}` });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user with the correct enum type for role
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role, // Use the validated enum value
        ...(practiceId && { practiceId })
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    // Generate token
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // User ID is attached by auth middleware
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error retrieving user' });
  }
}; 