import express from 'express';
import {
    createStudy,
    getStudies,
    getStudyById,
    updateStudy,
    deleteStudy,
    addPatientToStudy,
    removePatientFromStudy,
    assignUserToStudy,
    unassignUserFromStudy,
} from '../controllers/study.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware'; // Assuming this middleware exists
import {
    createStudySchema,
    updateStudySchema,
    studyPatientSchema,
    studyAssignmentSchema,
} from '../schemas/study.schema';

const router = express.Router();

// Apply authentication middleware to all study routes
router.use(authenticate);

// --- Core Study CRUD --- //
router.post(
    '/',
    validate(createStudySchema), // Validate request body
    createStudy
);

router.get(
    '/',
    getStudies // TODO: Add query param validation/filtering
);

router.get(
    '/:studyId',
    validate(updateStudySchema.pick({ params: true })), // Validate only params (studyId)
    getStudyById
);

router.put(
    '/:studyId',
    validate(updateStudySchema), // Validate params and body
    updateStudy
);

router.delete(
    '/:studyId',
    validate(updateStudySchema.pick({ params: true })), // Validate only params (studyId)
    deleteStudy
);

// --- Study Patient Management --- //
router.post(
    '/:studyId/patients/:patientId',
    validate(studyPatientSchema), // Validate params
    addPatientToStudy
);

router.delete(
    '/:studyId/patients/:patientId',
    validate(studyPatientSchema), // Validate params
    removePatientFromStudy
);

// --- Study User Assignment --- //
router.post(
    '/:studyId/users/:userId',
    validate(studyAssignmentSchema), // Validate params and potentially body (for role)
    assignUserToStudy
);

router.delete(
    '/:studyId/users/:userId',
    validate(studyPatientSchema), // Use studyPatientSchema for params only validation here
    unassignUserFromStudy
);

export default router; 