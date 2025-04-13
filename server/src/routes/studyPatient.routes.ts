import express from 'express';
import observationRoutes from './observation.routes';

// Create router preserving parent param (studyId)
const router = express.Router({ mergeParams: true });

// Further nest observation routes under the patientId
// Route: /studies/:studyId/patients/:patientId/observations
router.use('/:patientId/observations', observationRoutes);

// Potentially add other routes specific to a patient within a study here later
// e.g., GET /studies/:studyId/patients/:patientId/details

export default router; 