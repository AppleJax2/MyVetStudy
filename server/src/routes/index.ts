import express from 'express';
import authRoutes from './auth.routes';
import monitoringPlanRoutes from './monitoring-plan.routes';
import patientRoutes from './patient.routes';
import symptomRoutes from './symptom.routes';
import observationRoutes from './observation.routes';
import notificationRoutes from './notification.routes';
import { practiceSubscriptionRouter as subscriptionRoutes } from './subscription.routes';
import teamRoutes from './team.routes';
import healthRoutes from './health.routes';
import practiceRoutes from './practice.routes';

// Legacy routes (redirected or maintained for backward compatibility)
import studyRoutes from './study.routes';
import studyPatientRoutes from './studyPatient.routes';

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Monitoring plan routes (new naming convention)
router.use('/monitoring-plans', monitoringPlanRoutes);

// Patient routes
router.use('/patients', patientRoutes);

// Symptom routes
router.use('/symptoms', symptomRoutes);

// Observation routes
router.use('/observations', observationRoutes);

// Health Note routes (specific subset of observations)
router.use('/patients/:patientId/plan-enrollments/:monitoringPlanPatientId/health-notes', healthRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Subscription routes
router.use('/subscriptions', subscriptionRoutes);

// Team management routes
router.use('/team', teamRoutes);

// Practice management routes
router.use('/practice', practiceRoutes);

// Legacy routes (for backward compatibility)
router.use('/studies', studyRoutes);
router.use('/study-patients', studyPatientRoutes);

export default router; 