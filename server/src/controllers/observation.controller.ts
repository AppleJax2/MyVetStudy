import { Response, NextFunction } from 'express';
import * as observationService from '../services/observation.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
    CreateObservationInput,
    ListObservationsInput,
    ObservationParamsInput
} from '../schemas/observation.schema';
import AppError from '../utils/appError';
import { PrismaClient, SymptomDataType, Observation } from '../../generated/prisma';
import { findHealthNoteTemplate } from '../services/health-template.service';

const prisma = new PrismaClient();

// TODO: Add detailed logging

// Controller to create a new Observation
export const createObservation = async (
    // Assuming studyId is in params, patientId/symptomId/value in body
    req: AuthenticatedRequest<CreateObservationInput['params'], {}, CreateObservationInput['body']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { studyId } = req.params;
        const data = req.body;
        const userId = req.user?.id;
        const practiceId = req.user?.practiceId;

        if (!userId || !practiceId) {
            return next(new AppError('Authentication details missing', 401));
        }

        const newObservation = await observationService.createObservation(
            studyId,
            data, // Contains patientId, symptomTemplateId, value, notes
            userId,
            practiceId
        );

        res.status(201).json({
            status: 'success',
            message: 'Observation recorded successfully',
            data: newObservation,
        });
    } catch (error) {
        next(error);
    }
};

// Controller to get Observations based on filters
export const getObservations = async (
    // Assuming studyId and patientId might be in params based on route structure
    req: AuthenticatedRequest<ListObservationsInput['params'], ListObservationsInput['query']>, // Params and Query
    res: Response,
    next: NextFunction
) => {
    try {
        const params = req.params;
        const query = req.query;
        const practiceId = req.user?.practiceId;

        if (!practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // Combine params and query into criteria for the service
        const criteria = {
            ...params, // e.g., studyId, patientId from route
            ...query,  // e.g., symptomTemplateId, dates, limit, page from query string
        };

        const result = await observationService.findObservations(criteria, practiceId);

        res.status(200).json({
            status: 'success',
            message: 'Observations retrieved successfully',
            results: result.observations.length,
            pagination: result.pagination,
            data: result.observations,
        });
    } catch (error) {
        next(error);
    }
};

// Controller to delete a specific Observation
export const deleteObservation = async (
    // Assuming observationId is in params
    req: AuthenticatedRequest<ObservationParamsInput['params']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { observationId } = req.params;
        const practiceId = req.user?.practiceId;
        const userId = req.user?.id;

        if (!practiceId || !userId) {
            return next(new AppError('Authentication details missing', 401));
        }

        await observationService.deleteObservation(observationId, practiceId, userId);

        res.status(204).send();

    } catch (error) {
        next(error);
    }
};

// Note: GetObservationById is less common, usually handled via getObservations with filters.
// UpdateObservation might be needed depending on requirements.

// --- Health Note Specific Functions ---

// Define input types (Ideally replace with Zod schemas later)
interface CreateHealthNoteParams {
    patientId: string;
    monitoringPlanPatientId: string;
}
interface CreateHealthNoteBody {
    notes: string;
}
interface ListHealthNotesParams {
    patientId: string;
    monitoringPlanPatientId: string;
}

// Create a new health note observation
export const createHealthNoteObservation = async (
    req: AuthenticatedRequest<CreateHealthNoteParams, {}, CreateHealthNoteBody>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const { patientId, monitoringPlanPatientId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;
    const userPracticeId = req.user?.practiceId;

    // Basic validation
    if (!userId || !userPracticeId) {
        return next(new AppError('Authentication required.', 401));
    }
    // Note: Param validation (patientId, monitoringPlanPatientId) should happen in routes/middleware ideally
    if (!notes || typeof notes !== 'string' || notes.trim() === '') {
        return next(new AppError('Notes content is required.', 400));
    }

    try {
        // 1. Verify MonitoringPlanPatient record exists and belongs to the user's practice
        const planPatientRecord = await prisma.monitoringPlanPatient.findUnique({
            where: {
                id: monitoringPlanPatientId,
                patientId: patientId,
                monitoringPlan: {
                    practiceId: userPracticeId,
                },
            },
            select: { id: true } // Only need to confirm existence
        });

        if (!planPatientRecord) {
            return next(
                new AppError(
                    'Monitoring plan enrollment not found or access denied.',
                    404
                )
            );
        }

        // 2. Find or create the HEALTH_NOTE template
        const healthNoteTemplateId = await findHealthNoteTemplate(userPracticeId);

        // 3. Create the observation
        const newObservation: Observation = await prisma.observation.create({
            data: {
                symptomTemplateId: healthNoteTemplateId,
                patientId: patientId,
                monitoringPlanPatientId: monitoringPlanPatientId,
                recordedById: userId,
                recordedAt: new Date(),
                notes: notes.trim(),
                value: {}, // No specific value for HEALTH_NOTE type
            },
            include: {
                recordedBy: { // Include user info for display
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
            }
        });

        res.status(201).json({
            status: 'success',
            message: 'Health note recorded successfully',
            data: newObservation,
        });

    } catch (error) {
        // Let the global error handler manage AppErrors and log others
        next(error);
    }
};

// Get all health note observations for a specific monitoring plan enrollment
export const getHealthNoteObservationsForPlanPatient = async (
    req: AuthenticatedRequest<ListHealthNotesParams>, // Only params needed
    res: Response,
    next: NextFunction
): Promise<void> => {
    const { patientId, monitoringPlanPatientId } = req.params;
    const userPracticeId = req.user?.practiceId;

    if (!userPracticeId) {
        return next(new AppError('Authentication required.', 401));
    }
    // Note: Param validation should happen in routes/middleware ideally

    try {
        // 1. Verify MonitoringPlanPatient record exists and belongs to the user's practice
        // This check is important for security and data integrity.
        const planPatientRecord = await prisma.monitoringPlanPatient.count({
             where: {
                id: monitoringPlanPatientId,
                patientId: patientId,
                monitoringPlan: {
                    practiceId: userPracticeId,
                },
            },
        });

         if (planPatientRecord === 0) {
            return next(
                new AppError(
                    'Monitoring plan enrollment not found or access denied.',
                    404
                )
            );
        }

        // 2. Find the HEALTH_NOTE template ID
        const healthNoteTemplateId = await findHealthNoteTemplate(userPracticeId);

        // 3. Find observations
        const observations = await prisma.observation.findMany({
            where: {
                // Ensure we only get records for the correct patient and plan enrollment
                patientId: patientId,
                monitoringPlanPatientId: monitoringPlanPatientId,
                symptomTemplateId: healthNoteTemplateId, // Filter by the specific template
            },
            orderBy: {
                recordedAt: 'desc', // Show newest first
            },
             include: {
                recordedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
            }
        });

        res.status(200).json({
            status: 'success',
            message: 'Health notes retrieved successfully',
            results: observations.length,
            data: observations,
            // Add pagination later if needed
        });

    } catch (error) {
        next(error);
    }
};

// --- Potential Future Enhancements ---
// export const updateHealthNoteObservation = async (...) => { ... };
// export const deleteHealthNoteObservation = async (...) => { ... }; 