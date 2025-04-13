import express from 'express';
import {
    createObservation,
    getObservations,
    deleteObservation,
} from '../controllers/observation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    createObservationSchema,
    listObservationsSchema,
    observationParamsSchema
} from '../schemas/observation.schema';

// Create router preserving parent params (studyId, patientId - assuming mounted under /studies/:studyId/patients/:patientId)
const router = express.Router({ mergeParams: true });

// Authentication is handled by parent routers

// Route: /studies/:studyId/patients/:patientId/observations/

router.post(
    '/',
    // Use create schema, but note studyId/patientId come from params, rest from body
    // Need to adjust schema or validation logic if params aren't separate
    // For now, assuming validation targets body for patientId/symptomId/value
    validate(createObservationSchema.omit({ params: true })), // Validate body only initially
    createObservation
);

router.get(
    '/',
    validate(listObservationsSchema), // Validates params (studyId, patientId) and query
    getObservations
);

// Route: /studies/:studyId/patients/:patientId/observations/:observationId
// (Need to adjust if mounting differently)

router.delete(
    '/:observationId',
    // Validate observationId param - Need to add studyId/patientId context if needed for schema
    validate(observationParamsSchema),
    deleteObservation
);

export default router; 