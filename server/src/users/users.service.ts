import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all users for a specific practice
   * @param practiceId - Practice ID to filter users by
   * @param options - Pagination and filter options
   * @returns Users and pagination metadata
   */
  async findAll(practiceId: string, options: { 
    role?: UserRole; 
    search?: string;
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  } = {}) {
    const { 
      role, 
      search, 
      page = 1, 
      limit = 10,
      includeInactive = false
    } = options;

    // Calculate pagination values
    const skip = (page - 1) * limit;

    // Build the where conditions
    const where: any = { practiceId };
    
    // Only include active users by default
    if (!includeInactive) {
      where.isActive = true;
    }
    
    // Add role filter if provided
    if (role) {
      where.role = role;
    }

    // Add search filter if provided
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query with pagination
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          practiceId: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: {
          lastName: 'asc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrevious,
      },
    };
  }

  /**
   * Find a user by ID
   * @param id - User ID to find
   * @param practiceId - Practice ID to ensure user belongs to the practice
   * @returns User data without password
   */
  async findById(id: string, practiceId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        practiceId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        practiceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Create a new user
   * @param userData - User data to create
   * @param practiceId - Practice ID to associate the user with
   * @returns Created user data without password
   */
  async create(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }, practiceId: string) {
    const { email, password, firstName, lastName, role } = userData;

    // Check if user with email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    try {
      // Create new user
      const newUser = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          role,
          practice: {
            connect: { id: practiceId }
          },
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          practiceId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return newUser;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      throw new InternalServerErrorException('Could not create user');
    }
  }

  /**
   * Update a user's information
   * @param id - User ID to update
   * @param userData - User data to update
   * @param practiceId - Practice ID to ensure user belongs to the practice
   * @returns Updated user data without password
   */
  async update(id: string, userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
  }, practiceId: string) {
    // Check if user exists and belongs to practice
    const userExists = await this.prisma.user.findFirst({
      where: {
        id,
        practiceId,
      },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // If email is being updated, check if it's already in use
    if (userData.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: userData.email.toLowerCase(),
          NOT: { id },
        },
        select: { id: true },
      });

      if (existingUser) {
        throw new ConflictException('Email is already in use');
      }
    }

    try {
      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...(userData.firstName && { firstName: userData.firstName }),
          ...(userData.lastName && { lastName: userData.lastName }),
          ...(userData.email && { email: userData.email.toLowerCase() }),
          ...(userData.role && { role: userData.role }),
          ...(userData.isActive !== undefined && { isActive: userData.isActive }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          practiceId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email is already in use');
      }
      throw new InternalServerErrorException('Could not update user');
    }
  }

  /**
   * Update a user's password
   * @param id - User ID to update
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @param practiceId - Practice ID to ensure user belongs to the practice
   * @returns Success message
   */
  async updatePassword(id: string, currentPassword: string, newPassword: string, practiceId: string) {
    // Check if user exists and belongs to practice
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        practiceId,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'Password updated successfully' };
  }

  /**
   * Reset a user's password (admin function)
   * @param id - User ID to update
   * @param newPassword - New password to set
   * @param practiceId - Practice ID to ensure user belongs to the practice
   * @returns Success message
   */
  async resetPassword(id: string, newPassword: string, practiceId: string) {
    // Check if user exists and belongs to practice
    const userExists = await this.prisma.user.findFirst({
      where: {
        id,
        practiceId,
      },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Delete a user (soft delete by setting isActive to false)
   * @param id - User ID to delete
   * @param practiceId - Practice ID to ensure user belongs to the practice
   * @returns Success message
   */
  async softDelete(id: string, practiceId: string) {
    // Check if user exists and belongs to practice
    const userExists = await this.prisma.user.findFirst({
      where: {
        id,
        practiceId,
      },
      select: { id: true },
    });

    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // Soft delete user by setting isActive to false
    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return { message: 'User deactivated successfully' };
  }
} 