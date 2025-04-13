import express from 'express';
import authRoutes from './auth.routes';
import studyRoutes from './study.routes'; // Import study routes
import notificationRoutes from './notification.routes'; // Import notification routes
import { practiceSubscriptionRouter, webhookRouter } from './subscription.routes'; // Import subscription routers
// Import a router for practice details if it exists, or define routes here
// import practiceRoutes from './practice.routes';

const router = express.Router();

// --- Webhook Route (Needs Raw Body Parser - configure in app.ts) ---
router.use('/webhooks', webhookRouter);

// --- Standard API Routes --- //
router.get('/healthcheck', (_, res) => res.sendStatus(200));

router.use('/auth', authRoutes);
router.use('/studies', studyRoutes); // Mount study routes under /studies
router.use('/notifications', notificationRoutes); // Mount notification routes

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