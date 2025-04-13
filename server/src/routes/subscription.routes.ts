import express from 'express';
import {
    getSubscriptionDetails,
    getSubscriptionHistory,
    createCheckoutSession,
    handleWebhook
} from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    getSubscriptionSchema,
    listSubscriptionHistorySchema,
    // updateSubscriptionSchema, // Not used directly via controller
    // Schema for createCheckoutSession body needed
} from '../schemas/subscription.schema';
import { z } from 'zod'; // For inline schema definition if needed
import { SubscriptionTier } from '../generated/prisma'; // For tier enum

// Router for practice-specific subscription actions (requires auth)
const practiceSubscriptionRouter = express.Router({ mergeParams: true });
practiceSubscriptionRouter.use(authenticate); // Apply auth to these routes

// GET /practices/:practiceId/subscription
practiceSubscriptionRouter.get(
    '/',
    validate(getSubscriptionSchema),
    getSubscriptionDetails
);

// GET /practices/:practiceId/subscription/history
practiceSubscriptionRouter.get(
    '/history',
    validate(listSubscriptionHistorySchema),
    getSubscriptionHistory
);

// POST /practices/:practiceId/subscription/checkout-session
// (Initiates payment process for a tier)
practiceSubscriptionRouter.post(
    '/checkout-session',
    validate(z.object({ // Inline validation for body
        params: getSubscriptionSchema.shape.params, // Reuse practiceId param validation
        body: z.object({ tier: z.nativeEnum(SubscriptionTier) })
    })),
    createCheckoutSession
);

// --- Webhook Router (Separate, No Auth) --- //

const webhookRouter = express.Router();

// POST /webhooks/stripe (or other provider)
webhookRouter.post(
    '/stripe', // Example path
    // IMPORTANT: Needs raw body parser configured in app.ts for this route
    handleWebhook
);


export { practiceSubscriptionRouter, webhookRouter }; 