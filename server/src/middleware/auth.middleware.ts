import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.client';
import AppError from '../utils/appError';
import { User } from '../generated/prisma'; // Import User type

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

// TODO: Add authorization middleware (e.g., check roles)
// export const authorize = (...roles: string[]) => {
//     return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//         if (!req.user || !roles.includes(req.user.role)) {
//             return next(new AppError('You do not have permission to perform this action', 403));
//         }
//         next();
//     };
// }; 