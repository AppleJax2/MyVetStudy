import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import AppError from '../utils/appError';
import { Permission } from '../utils/rolePermissions';

// Type declarations to safely access user data from request
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        practiceId: string;
        role: UserRole;
        permissions?: string[];
      };
    }
  }
}

/**
 * Middleware to restrict access based on user roles
 * @param roles - Allowed roles (one or more roles)
 */
export const restrictToRoles = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists and has a role
      if (!req.user || !req.user.role) {
        return next(new AppError('Unauthorized - Not authenticated', 401));
      }

      // Convert single role to array for consistent handling
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return next(new AppError('Forbidden - You do not have permission to access this resource', 403));
      }

      // User has an allowed role
      next();
    } catch (error) {
      next(new AppError('Authentication error', 500));
    }
  };
};

/**
 * Middleware to restrict access based on user permissions
 * @param requiredPermissions - Required permissions (one or more)
 * @param requireAll - Whether all permissions are required (default: false)
 */
export const restrictTo = (requiredPermissions: Permission | Permission[], requireAll = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists
      if (!req.user) {
        return next(new AppError('Unauthorized - Not authenticated', 401));
      }

      // Practice Owner (formerly Practice Manager) always has access to everything
      if (req.user.role === UserRole.PRACTICE_OWNER) {
        return next();
      }

      // Convert single permission to array for consistent handling
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // If user doesn't have permissions array attached (should be attached during authentication)
      if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
        return next(new AppError('Forbidden - Permissions not available', 403));
      }

      // Check permissions
      const hasPermission = requireAll
        ? permissions.every(permission => req.user!.permissions!.includes(permission))
        : permissions.some(permission => req.user!.permissions!.includes(permission));

      if (!hasPermission) {
        return next(new AppError('Forbidden - You do not have the required permissions', 403));
      }

      // User has required permissions
      next();
    } catch (error) {
      next(new AppError('Permission verification error', 500));
    }
  };
}; 