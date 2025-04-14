import express from 'express';
import {
    createMonitoringPlan,
    getMonitoringPlans,
    getMonitoringPlanById,
    updateMonitoringPlan,
    deleteMonitoringPlan,
    addPatientToMonitoringPlan,
    removePatientFromMonitoringPlan,
    assignUserToMonitoringPlan,
    unassignUserFromMonitoringPlan,
    generateShareableLink,
    getSymptomTemplates,
    createSymptomTemplate,
    updateSymptomTemplate,
    deleteSymptomTemplate,
    getMonitoringPlanByShareToken,
    revokeShareableLink,
    getPatientsByMonitoringPlanId,
    updateMonitoringPlanPatients,
} from '../controllers/monitoring-plan.controller';
import { authenticate, authorize, authorizeVeterinarianOrHigher } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    createMonitoringPlanSchema,
    updateMonitoringPlanSchema,
    monitoringPlanPatientSchema,
    monitoringPlanAssignmentSchema,
    symptomTemplateSchema,
    updateSymptomTemplateSchema,
    deleteSymptomTemplateSchema,
    generateShareableLinkSchema,
    getMonitoringPlanByShareTokenSchema,
    updateMonitoringPlanPatientsSchema,
} from '../schemas/monitoring-plan.schema';
import symptomRoutes from './symptom.routes';
import { UserRole } from '../../generated/prisma';

const router = express.Router();

// Apply authentication middleware to all monitoring plan routes
router.use(authenticate);

// --- Core Monitoring Plan CRUD --- //

// Creating a monitoring plan requires at least veterinarian privileges
router.post(
    '/',
    authorizeVeterinarianOrHigher,
    validate(createMonitoringPlanSchema),
    createMonitoringPlan
);

// Any authenticated user can view monitoring plans they have access to
router.get(
    '/',
    getMonitoringPlans
);

// Any authenticated user can view monitoring plan details they have access to
router.get(
    '/:id',
    validate(updateMonitoringPlanSchema.pick({ params: true })),
    getMonitoringPlanById
);

// Updating a monitoring plan requires at least veterinarian privileges
router.put(
    '/:id',
    authorizeVeterinarianOrHigher,
    validate(updateMonitoringPlanSchema),
    updateMonitoringPlan
);

// Deleting a monitoring plan requires veterinarian or higher privileges
router.delete(
    '/:id',
    authorizeVeterinarianOrHigher,
    validate(updateMonitoringPlanSchema.pick({ params: true })),
    deleteMonitoringPlan
);

// --- Nested Routes --- //

// Mount symptom routes: /monitoring-plans/:id/symptoms
router.use('/:id/symptoms', symptomRoutes);

// --- Monitoring Plan Patient Management --- //

// Adding a patient requires at least veterinarian privileges
router.post(
    '/:id/patients/:patientId',
    authorizeVeterinarianOrHigher,
    validate(monitoringPlanPatientSchema),
    addPatientToMonitoringPlan
);

// Removing a patient requires at least veterinarian privileges
router.delete(
    '/:id/patients/:patientId',
    authorizeVeterinarianOrHigher,
    validate(monitoringPlanPatientSchema),
    removePatientFromMonitoringPlan
);

// --- Monitoring Plan User Assignment --- //

// Assigning users requires veterinarian or higher privileges
router.post(
    '/:id/users/:userId',
    authorizeVeterinarianOrHigher,
    validate(monitoringPlanAssignmentSchema),
    assignUserToMonitoringPlan
);

// Unassigning users requires veterinarian or higher privileges
router.delete(
    '/:id/users/:userId',
    authorizeVeterinarianOrHigher,
    validate(monitoringPlanPatientSchema.pick({ params: true })),
    unassignUserFromMonitoringPlan
);

// --- Monitoring Plan Patient Assignment --- //

// Getting patients by monitoring plan ID
router.get(
    '/:id/patients',
    validate(updateMonitoringPlanSchema.pick({ params: true })),
    getPatientsByMonitoringPlanId
);

// Updating monitoring plan patients
router.put(
    '/:id/patients',
    validate(updateMonitoringPlanPatientsSchema),
    updateMonitoringPlanPatients
);

// --- Monitoring Plan Shareable Link Management --- //

// Generating a shareable link
router.post(
    '/:id/share',
    validate(generateShareableLinkSchema),
    generateShareableLink
);

// Revoking a shareable link
router.delete(
    '/:id/share',
    validate(updateMonitoringPlanSchema.pick({ params: true })),
    revokeShareableLink
);

// Public route for accessing a monitoring plan via shareable link (no authentication required)
router.get(
    '/shared/:token',
    validate(getMonitoringPlanByShareTokenSchema),
    getMonitoringPlanByShareToken
);

export default router; 