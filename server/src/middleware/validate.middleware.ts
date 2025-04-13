import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware factory to validate request data (params, query, body) against a Zod schema.
 * @param schema The Zod schema to validate against.
 * @returns Express middleware function.
 */
export const validate = (schema: AnyZodObject) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    path: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({
                    status: 'fail',
                    message: 'Input validation failed',
                    errors: formattedErrors,
                });
            }
            // Handle unexpected errors
            console.error('Unexpected validation error:', error); // Log unexpected errors
            return res.status(500).json({ message: 'Internal Server Error during validation' });
        }
    }; 