import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscription.service';
import * as practiceService from '../services/practice.service'; // To get current practice details
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
    UpdateSubscriptionInput,
    GetSubscriptionInput,
    ListSubscriptionHistoryInput,
} from '../schemas/subscription.schema';
import { SubscriptionTier } from '../generated/prisma';
import AppError from '../utils/appError';

// TODO: Add detailed logging
// TODO: Add robust permission checks (e.g., only PRACTICE_OWNER can manage subscriptions)

// Controller to get current subscription details for a practice
export const getSubscriptionDetails = async (
    req: AuthenticatedRequest<GetSubscriptionInput['params']>, // practiceId from params
    res: Response,
    next: NextFunction
) => {
    try {
        const { practiceId } = req.params;
        const requestingUserId = req.user?.id;
        const requestingUserPracticeId = req.user?.practiceId;

        if (!requestingUserId || !requestingUserPracticeId) {
            return next(new AppError('Authentication details missing', 401));
        }

        // Authorization: Ensure the user belongs to the practice they are querying
        if (practiceId !== requestingUserPracticeId) {
             return next(new AppError('You can only view the subscription for your own practice', 403));
        }
        // Optional: Add role check (e.g., only owner/admin can view)

        // Fetch the practice details (which include subscription fields)
        const practice = await practiceService.findPracticeById(practiceId);
        if (!practice) {
            return next(new AppError('Practice not found', 404));
        }

        // Select relevant subscription fields to return
        const subscriptionDetails = {
            tier: practice.subscriptionTier,
            status: practice.subscriptionStatus,
            startDate: practice.subscriptionStartDate,
            endDate: practice.subscriptionEndDate,
            // Add other relevant details like limits if needed
        };

        res.status(200).json({
            status: 'success',
            data: subscriptionDetails,
        });
    } catch (error) {
        next(error);
    }
};

// Controller to get subscription history for a practice
export const getSubscriptionHistory = async (
    req: AuthenticatedRequest<ListSubscriptionHistoryInput['params'], ListSubscriptionHistoryInput['query']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { practiceId } = req.params;
        const query = req.query;
        const requestingUserId = req.user?.id;
        const requestingUserPracticeId = req.user?.practiceId;

        if (!requestingUserId || !requestingUserPracticeId) {
            return next(new AppError('Authentication details missing', 401));
        }

        // Authorization: Ensure user is viewing their own practice's history
         if (practiceId !== requestingUserPracticeId) {
             return next(new AppError('You can only view the subscription history for your own practice', 403));
        }
        // Optional: Add role check

        const options = {
            limit: query?.limit,
            page: query?.page,
        };

        const result = await subscriptionService.getSubscriptionHistory(practiceId, options);

        res.status(200).json({
            status: 'success',
            results: result.history.length,
            pagination: result.pagination,
            data: result.history,
        });
    } catch (error) {
        next(error);
    }
};

// --- Placeholders for Payment Provider Interaction ---

// Controller to initiate a checkout session (e.g., redirect user to Stripe)
export const createCheckoutSession = async (
    req: AuthenticatedRequest<{ practiceId: string }, {}, { tier: SubscriptionTier }>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { practiceId } = req.params;
        const { tier } = req.body; // Target tier from request body
        const userId = req.user?.id;
        const userPracticeId = req.user?.practiceId;

        if (!userId || !userPracticeId) {
             return next(new AppError('Authentication details missing', 401));
        }
        if (practiceId !== userPracticeId) {
             return next(new AppError('Cannot initiate checkout for another practice', 403));
        }
        // TODO: Add permission checks (e.g., only PRACTICE_OWNER can initiate)

        // Validate tier? Basic check:
        if (!Object.values(SubscriptionTier).includes(tier)) {
             return next(new AppError('Invalid subscription tier selected', 400));
        }

        // Call service to create Stripe (or other provider) session
        const session = await subscriptionService.createCheckoutSession(practiceId, tier, userId);

        // Return the session URL/ID to the client
        res.status(200).json({
            status: 'success',
            message: 'Checkout session created',
            data: session, // Contains URL/ID
        });

    } catch (error) {
        next(error);
    }
};

// Controller to handle incoming webhooks from payment provider
// This endpoint should NOT require standard JWT authentication
// It should verify the webhook signature instead.
export const handleWebhook = async (
    req: Request, // Use standard Request
    res: Response,
    next: NextFunction
) => {
    console.log('Webhook received...');
    const signature = req.headers['stripe-signature'] as string; // Example for Stripe

    if (!signature) {
        console.warn('Webhook missing signature');
        return res.status(400).send('Webhook Error: Missing signature');
    }

    try {
        // Body needs to be raw for signature verification
        // Ensure body-parser doesn't parse JSON for this specific route (configure in app.ts)
        await subscriptionService.handleWebhook(req.body, signature);

        // Send success response to acknowledge receipt
        res.status(200).json({ received: true });

    } catch (error: any) {
        console.error('Webhook handling error:', error.message);
        // Don't use AppError for webhook responses usually
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }
};

// NOTE: updatePracticeSubscription service function is typically called internally
// by the handleWebhook controller after successful payment verification,
// so it doesn't usually need its own direct controller endpoint. 