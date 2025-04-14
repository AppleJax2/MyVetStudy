import express from 'express';
import authRoutes from './auth.routes';
import studyRoutes from './study.routes'; // Keep study routes for backward compatibility
import monitoringPlanRoutes from './monitoring-plan.routes'; // Import new monitoring plan routes
import patientRoutes from './patient.routes'; // Import patient routes
import notificationRoutes from './notification.routes';
import { practiceSubscriptionRouter, webhookRouter } from './subscription.routes';
// Import a router for practice details if it exists, or define routes here
// import practiceRoutes from './practice.routes';

const router = express.Router();

// --- Webhook Route (Needs Raw Body Parser - configure in app.ts) ---
router.use('/webhooks', webhookRouter);

// --- Standard API Routes --- //
router.get('/healthcheck', (_, res) => res.sendStatus(200));

router.use('/auth', authRoutes);
router.use('/monitoring-plans', monitoringPlanRoutes); // Mount monitoring plan routes under /monitoring-plans
router.use('/patients', patientRoutes); // Mount patient routes
router.use('/studies', studyRoutes); // Keep study routes for backward compatibility
router.use('/notifications', notificationRoutes);

// Mount practice-specific routes (including subscription management)
// If a dedicated practice router exists:
// router.use('/practices', practiceRoutes); // Assuming practiceRoutes handles /:practiceId internally
// Mount subscription routes nested under practice:
// practiceRoutes.use('/:practiceId/subscription', practiceSubscriptionRouter);

// --- Temporary direct mounting if no dedicated practice router yet ---
// TODO: Refactor into a dedicated practice router if more practice routes are added
router.use('/practices/:practiceId/subscription', practiceSubscriptionRouter);
// Example route for practice details (if no dedicated router)
// router.get('/practices/:practiceId', authenticate, getPracticeDetailsController); // Need controller

export default router; 