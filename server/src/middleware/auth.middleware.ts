import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import AppError from '../utils/appError';
import { User, UserRole } from '../../generated/prisma'; // Include UserRole enum

// Define an interface extending Express Request to include the user property
export interface AuthenticatedRequest<P = {}, Q = {}, B = {}> extends Request<P, {}, B, Q> {
    user?: User & { practiceId?: string | null }; // Make user optional initially, ensure practiceId is included
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        let token;
        // 1) Check if token exists in headers
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }
        // TODO: Add check for token in cookies as well for web clients if needed

        if (!token) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        // 2) Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

        // 3) Check if user still exists
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            // Optionally include related data like role or practice if needed frequently
            // include: { practice: true } // Example
        });

        if (!currentUser || !currentUser.isActive) {
            return next(new AppError('The user belonging to this token no longer exists or is inactive.', 401));
        }

        // 4) Grant access to protected route
        // Attach user to the request object
        req.user = currentUser;
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
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        // Check if user is authenticated
        if (!req.user) {
            return next(new AppError('You must be logged in to access this resource', 401));
        }
        
        // Check if user's role is in the allowed roles
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        
        // User is authorized
        next();
    };
};

/**
 * Practice owner authorization middleware
 * Used for operations that can only be performed by practice owners or managers
 */
export const authorizePracticeOwner = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
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
 */
export const authorizeVeterinarianOrHigher = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return next(new AppError('You must be logged in to access this resource', 401));
    }
    
    const allowedRoles = [UserRole.PRACTICE_OWNER, UserRole.VETERINARIAN];
    
    if (!allowedRoles.includes(req.user.role)) {
        return next(new AppError('This action requires veterinarian or higher privileges', 403));
    }
    
    next();
}; 