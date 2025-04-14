import { Request, Response } from 'express';
import prisma from '../utils/prisma'; // Import shared Prisma instance
import { hashPassword, comparePasswords, generateToken } from '../utils/auth.utils';
import { UserRole } from '@prisma/client'; // Keep enum for type safety if possible, but don't use for runtime validation here

// Define valid roles explicitly for runtime validation
// Map incoming role strings (from frontend/API) to the actual Prisma enum values
const validRoles: Record<string, UserRole> = {
  PRACTICE_MANAGER: UserRole.PRACTICE_OWNER, // Map incoming "PRACTICE_MANAGER" to the correct enum
  VETERINARIAN: UserRole.VETERINARIAN,
  TECHNICIAN: UserRole.TECHNICIAN,
  ASSISTANT: UserRole.ASSISTANT,             // Add based on linter hint
  RECEPTIONIST: UserRole.RECEPTIONIST,         // Add based on linter hint
  // PET_OWNER: UserRole.PET_OWNER // Comment out PET_OWNER if it doesn't exist in the backend enum
  // If PET_OWNER registration is needed, the backend enum must be updated first.
};

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
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Validate the role string against the explicit list
    const role: UserRole | undefined = validRoles[roleString];
    if (!role) {
      // Add more specific error message if PET_OWNER is attempted but not supported
      if (roleString === 'PET_OWNER') {
          res.status(400).json({ message: `Role 'PET_OWNER' is not currently supported for registration.` });
          return;
      }
      res.status(400).json({ message: `Invalid or unsupported role provided: ${roleString}` });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user with the validated enum value
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role, // Use the validated role from our explicit list
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

export const login = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({ message: 'Account is deactivated' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
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

export const getMe = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    // User ID is attached by auth middleware
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error retrieving user' });
  }
}; 