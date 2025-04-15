import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials and return JWT token if valid
   * @param email - User email
   * @param password - User password
   * @returns JWT token and user data
   */
  async login(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        practiceId: true,
        role: true,
        isActive: true,
      },
    });

    // If user not found or inactive
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or inactive account');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.practiceId, [user.role]);

    // Return token and user data (excluding password)
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        practiceId: user.practiceId,
        role: user.role,
      },
    };
  }

  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Newly created user
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    practiceId: string;
    role?: string;
  }) {
    const { email, password, firstName, lastName, practiceId, role = 'USER' } = userData;

    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate practice
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
      select: { id: true },
    });

    if (!practice) {
      throw new BadRequestException('Invalid practice ID');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        practice: {
          connect: { id: practiceId },
        },
        role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        practiceId: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken(newUser.id, newUser.practiceId, [newUser.role]);

    return {
      token,
      user: newUser,
    };
  }

  /**
   * Generate JWT token
   * @param userId - User ID
   * @param practiceId - Practice ID
   * @param roles - User roles
   * @returns JWT token
   */
  generateToken(userId: string, practiceId: string, roles: string[] = []) {
    const payload = {
      sub: userId,
      practiceId,
      roles,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Verify JWT token
   * @param token - JWT token
   * @returns Decoded token payload
   */
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
} 