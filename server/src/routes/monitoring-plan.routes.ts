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

// Generate shareable link for a monitoring plan
router.post(
    '/:id/share',
    validate(updateMonitoringPlanSchema.pick({ params: true })),
    generateShareableLink
);

// Get monitoring plan via shareable token (public access)
router.get(
    '/shared/:token',
    getMonitoringPlanByShareToken
);

// Symptom template routes
router.get(
    '/:id/symptoms',
    validate(updateMonitoringPlanSchema.pick({ params: true })),
    getSymptomTemplates
);

router.post(
    '/:id/symptoms',
    validate(symptomTemplateSchema),
    createSymptomTemplate
);

router.put(
    '/:id/symptoms/:symptomId',
    validate(updateSymptomTemplateSchema),
    updateSymptomTemplate
);

router.delete(
    '/:id/symptoms/:symptomId',
    validate(deleteSymptomTemplateSchema),
    deleteSymptomTemplate
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

export default router; 