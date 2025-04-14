import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
// Import controller functions (adjust path if controller structure changes)
import {
    createHealthNoteObservation,
    getHealthNoteObservationsForPlanPatient,
} from '../controllers/observation.controller';
// Import or define validation schemas if needed (e.g., using Zod)
// import { createHealthNoteSchema, listHealthNotesSchema } from '../schemas/health.schema';

const router = express.Router();

// Prefix: /api/patients/:patientId/plan-enrollments/:monitoringPlanPatientId/health-notes
// (This assumes a nested structure, adjust if routes are organized differently)

// Apply authentication middleware to all routes in this file
router.use(authenticate);

// POST /api/patients/:patientId/plan-enrollments/:monitoringPlanPatientId/health-notes
// Create a new health note for a specific patient enrollment
router.post(
    '/',
    // validate(createHealthNoteSchema), // Uncomment and implement schema validation
    createHealthNoteObservation
);

// GET /api/patients/:patientId/plan-enrollments/:monitoringPlanPatientId/health-notes
// Get all health notes for a specific patient enrollment
router.get(
    '/',
    // validate(listHealthNotesSchema), // Uncomment and implement schema validation
    getHealthNoteObservationsForPlanPatient
);

export default router; 