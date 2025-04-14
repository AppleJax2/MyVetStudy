import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the authenticated user has the required role(s)
 * @param roles Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user exists on request (set by auth middleware)
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get the user's role
      const userRole = req.user.role;

      // Check if the user's role is in the allowed roles
      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      // User has required role, proceed to next middleware/controller
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}; 