import { Response, NextFunction } from 'express';
import * as observationService from '../services/observation.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
    CreateObservationInput,
    ListObservationsInput,
    ObservationParamsInput
} from '../schemas/observation.schema';
import AppError from '../utils/appError';

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