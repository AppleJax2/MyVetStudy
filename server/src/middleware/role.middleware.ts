import { Response } from 'express';
import type { NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import AppError from '../utils/appError';
import { Permission } from '../utils/rolePermissions';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Middleware to restrict access based on user roles
 * @param roles - Allowed roles (one or more roles)
 */
export const restrictToRoles = (roles: UserRole | UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      // Consider more specific error handling/logging
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
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      const permissionsToCheck = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // Check if user doesn't have permissions array attached (should be attached during authentication)
      if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
        // Log this - indicates an issue in the auth middleware likely
        console.error('Permissions array missing on req.user for user:', req.user.userId);
        return next(new AppError('Forbidden - Permissions not available', 403));
      }

      // Check permissions
      const hasPermission = requireAll
        ? permissionsToCheck.every(permission => req.user!.permissions!.includes(permission))
        : permissionsToCheck.some(permission => req.user!.permissions!.includes(permission));

      if (!hasPermission) {
        return next(new AppError('Forbidden - You do not have the required permissions', 403));
      }

      // User has required permissions
      next();
    } catch (error) {
      // Consider more specific error handling/logging
      console.error('Permission verification error:', error);
      next(new AppError('Permission verification error', 500));
    }
  };
}; 