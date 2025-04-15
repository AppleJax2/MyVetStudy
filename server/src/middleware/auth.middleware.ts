import { Request, Response } from 'express';
import type { NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import AppError from '../utils/appError';
import { UserRole } from '@prisma/client';
import { getPermissionsForRole, Permission } from '../utils/rolePermissions';

// Define and export an interface extending Express Request to include the user property
// Use this consistently instead of relying on potentially failing declaration merging
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        practiceId: string | null;
        role: UserRole;
        permissions: Permission[];
    }; 
    // If you need typed params/query/body consistently, add them here too
    // params: { id?: string; token?: string; /* ... */ };
    // query: { /* ... */ };
    // body: { /* ... */ };
}

// Use the explicit AuthenticatedRequest type in function signatures
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        let token;
        // Use bracket notation for header access
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

        // 3) Check if user still exists
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                practiceId: true,
                isActive: true
            }
        });

        if (!currentUser || !currentUser.isActive) {
            return next(new AppError('The user belonging to this token no longer exists or is inactive.', 401));
        }

        // 4) Get permissions based on user role
        const permissions = getPermissionsForRole(currentUser.role);

        // 5) Grant access to protected route
        // Attach user data to the request object (req.user is now part of Request type)
        req.user = {
            userId: currentUser.id,
            practiceId: currentUser.practiceId,
            role: currentUser.role,
            permissions: permissions
        };
        next();

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return next(new AppError('Invalid token. Please log in again.', 401));
        }
        if (error instanceof jwt.TokenExpiredError) {
            return next(new AppError('Your token has expired! Please log in again.', 401));
        }
        // Pass other errors to the global error handler
        next(error);
    }
};

/**
 * Role-based authorization middleware
 * 
 * @param roles - Array of allowed UserRole values
 * @returns Middleware function that checks if the authenticated user has one of the allowed roles
 */
export const authorize = (...roles: UserRole[]) => {
    // Use the explicit AuthenticatedRequest type
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) { // req.user comes from AuthenticatedRequest
            return next(new AppError('You must be logged in to access this resource', 401));
        }
        
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        
        next();
    };
};

/**
 * Practice owner authorization middleware
 * Used for operations that can only be performed by practice owners or managers
 * Assumes 'authenticate' middleware runs before this.
 */
// Use the explicit AuthenticatedRequest type
export const authorizePracticeOwner = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) { // req.user comes from AuthenticatedRequest
        return next(new AppError('You must be logged in to access this resource', 401));
    }
    
    if (req.user.role !== UserRole.PRACTICE_OWNER) {
        return next(new AppError('Only practice owners can perform this action', 403));
    }
    
    next();
};

/**
 * Veterinarian or higher authorization middleware
 * Used for operations that require at least veterinarian level access
 * Assumes 'authenticate' middleware runs before this.
 */
// Use the explicit AuthenticatedRequest type
export const authorizeVeterinarianOrHigher = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) { // req.user comes from AuthenticatedRequest
        return next(new AppError('You must be logged in to access this resource', 401));
    }
    
    const allowedRoles: UserRole[] = [UserRole.PRACTICE_OWNER, UserRole.VETERINARIAN];
    
    if (!allowedRoles.includes(req.user.role)) { 
        return next(new AppError('This action requires veterinarian or higher privileges', 403));
    }
    
    next();
}; 