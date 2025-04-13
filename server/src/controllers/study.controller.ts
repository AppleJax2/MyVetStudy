import { Request, Response, NextFunction } from 'express';
import * as studyService from '../services/study.service';
import { CreateStudyInput, UpdateStudyInput, StudyAssignmentInput } from '../schemas/study.schema'; // Assuming schemas will be created later
import AppError from '../utils/appError';
import { AuthenticatedRequest } from '../middleware/auth.middleware'; // Import AuthenticatedRequest type
import { StudyStatus } from '../generated/prisma'; // Correct import for StudyStatus

// TODO: Implement robust error handling and logging

export const createStudy = async (req: AuthenticatedRequest<{}, {}, CreateStudyInput['body']>, res: Response, next: NextFunction) => {
    try {
        // User information should be attached by the authenticate middleware
        if (!req.user?.id || !req.user?.practiceId) {
            // This should ideally be caught by the authenticate middleware itself
            return next(new AppError('Authentication details missing', 401));
        }

        const studyData = req.body;
        const userId = req.user.id;
        const practiceId = req.user.practiceId;

        // Call the service function to create the study
        const newStudy = await studyService.createStudy(studyData, userId, practiceId);

        res.status(201).json({
            status: 'success',
            message: 'Study created successfully',
            data: {
                study: newStudy,
            },
        });
    } catch (error) {
        // Pass errors to the global error handler
        next(error);
    }
};

export const getStudies = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // Extract query parameters for filtering and pagination
        // Basic parsing, consider using a validation schema for query params for more robustness
        const { status, search } = req.query;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
        const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

        // Validate status if provided
        let validatedStatus: StudyStatus | undefined;
        if (status && typeof status === 'string') {
            if (Object.values(StudyStatus).includes(status as StudyStatus)) {
                validatedStatus = status as StudyStatus;
            } else {
                return next(new AppError(`Invalid status filter: ${status}`, 400));
            }
        }

        const options = {
            status: validatedStatus,
            search: search as string | undefined,
            limit: isNaN(limit) || limit <= 0 ? 10 : limit,
            page: isNaN(page) || page <= 0 ? 1 : page,
        };

        const result = await studyService.findStudiesByPractice(req.user.practiceId, options);

        res.status(200).json({
            status: 'success',
            message: 'Studies retrieved successfully',
            data: result.studies,
            pagination: result.pagination,
        });

    } catch (error) {
        next(error);
    }
};

export const getStudyById = async (req: AuthenticatedRequest<{ studyId: string }>, res: Response, next: NextFunction) => {
    try {
        const studyId = req.params.studyId;
        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // Basic validation for UUID can be done here or rely on schema validation if applied route-level
        // Example basic check (consider Zod for robustness):
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(studyId)) {
             return next(new AppError('Invalid study ID format', 400));
        }

        const study = await studyService.findStudyById(studyId, req.user.practiceId);

        if (!study) {
            // Use 404 Not Found if the study doesn't exist or doesn't belong to the user's practice
            return next(new AppError('Study not found or you do not have permission to view it', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Study details retrieved successfully',
            data: {
                study,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const updateStudy = async (req: AuthenticatedRequest<{ studyId: string }, {}, UpdateStudyInput['body']>, res: Response, next: NextFunction) => {
    try {
        const studyId = req.params.studyId;
        const updateData = req.body;

        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // The studyId format is already validated by the route middleware
        // The body format is also validated by the route middleware

        // Check if there's any data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ status: 'fail', message: 'No update data provided' });
        }

        const updatedStudy = await studyService.updateStudy(studyId, updateData, req.user.practiceId);

        // The service now throws an error if not found/authorized, so no need to check for null here

        res.status(200).json({
            status: 'success',
            message: 'Study updated successfully',
            data: {
                study: updatedStudy,
            },
        });

    } catch (error) {
        next(error);
    }
};

export const deleteStudy = async (req: AuthenticatedRequest<{ studyId: string }>, res: Response, next: NextFunction) => {
    try {
        const studyId = req.params.studyId;

        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // studyId format is validated by route middleware

        await studyService.deleteStudy(studyId, req.user.practiceId);

        // Service throws error if not found/authorized/fails

        // Send 204 No Content on successful deletion
        res.status(204).send();

    } catch (error) {
        next(error);
    }
};

// --- Additional Study Management Functions ---

// Add patient to study
export const addPatientToStudy = async (req: AuthenticatedRequest<{ studyId: string; patientId: string }>, res: Response, next: NextFunction) => {
    try {
        const { studyId, patientId } = req.params;

        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // studyId and patientId format validated by route middleware (studyPatientSchema)

        const enrollment = await studyService.addPatientToStudyService(studyId, patientId, req.user.practiceId);

        res.status(201).json({
            status: 'success',
            message: 'Patient successfully enrolled in study',
            data: {
                enrollment,
            },
        });

    } catch (error) {
        next(error);
    }
};

// Remove patient from study
export const removePatientFromStudy = async (req: AuthenticatedRequest<{ studyId: string; patientId: string }>, res: Response, next: NextFunction) => {
     try {
        const { studyId, patientId } = req.params;

        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // Params validated by route middleware

        await studyService.removePatientFromStudyService(studyId, patientId, req.user.practiceId);

        // Service throws error if not found or fails

        res.status(204).send(); // No content on successful removal

    } catch (error) {
        next(error);
    }
};

// Assign user to study
export const assignUserToStudy = async (req: AuthenticatedRequest<{ studyId: string; userId: string }, {}, StudyAssignmentInput['body']>, res: Response, next: NextFunction) => {
     try {
        const { studyId, userId } = req.params;
        const { role } = req.body; // Role comes from the validated request body

        if (!req.user?.id || !req.user?.practiceId) {
            return next(new AppError('Authentication details missing', 401));
        }

        // Params and body (role) validated by route middleware (studyAssignmentSchema)
        if (!role) {
             // This should be caught by validation, but double-check
            return next(new AppError('Role is required to assign a user', 400));
        }

        const assignment = await studyService.assignUserToStudyService(
            studyId,
            userId, // The user being assigned
            role,   // The role from the request body
            req.user.practiceId,
            req.user.id // The user performing the assignment
        );

        res.status(200).json({ // Use 200 OK for both creation and update
            status: 'success',
            message: 'User successfully assigned to study',
            data: {
                assignment,
            },
        });

    } catch (error) {
        next(error);
    }
};

// Unassign user from study
export const unassignUserFromStudy = async (req: AuthenticatedRequest<{ studyId: string; userId: string }>, res: Response, next: NextFunction) => {
    try {
        const { studyId, userId } = req.params;

        if (!req.user?.id || !req.user?.practiceId) {
            return next(new AppError('Authentication details missing', 401));
        }

        // Params validated by route middleware

        await studyService.unassignUserFromStudyService(
            studyId,
            userId, // User being unassigned
            req.user.practiceId,
            req.user.id // User performing the action
        );

        // Service throws error if not found or fails

        res.status(204).send(); // No content on successful unassignment

    } catch (error) {
        next(error);
    }
}; 