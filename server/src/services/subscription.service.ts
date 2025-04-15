import prisma from '../utils/prisma';
import { Prisma, Practice, SubscriptionHistory, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import AppError from '../utils/appError';
import { SubscriptionTier as PrismaSubscriptionTier, SubscriptionStatus as PrismaSubscriptionStatus } from '@prisma/client';

// TODO: Add detailed logging
// TODO: Integrate with payment provider (e.g., Stripe) for checkout sessions and webhook handling.

/**
 * Updates the subscription tier and status for a practice.
 * Creates a history record of the change.
 * Typically called after a successful payment event.
 * @param practiceId - ID of the practice to update.
 * @param data - New subscription data (tier, payment details, dates).
 * @param actorUserId - ID of user performing the action (for auditing, if needed, though often system-triggered).
 * @returns The updated Practice object.
 * @throws AppError on DB errors or if practice not found.
 */
export const updatePracticeSubscription = async (
    practiceId: string,
    data: { newTier: SubscriptionTier; paymentId?: string; amount?: number; subscriptionStartDate?: Date; subscriptionEndDate?: Date },
    // actorUserId: string // Optional: If needed for auditing
): Promise<Practice> => {
    const { newTier, paymentId, amount, subscriptionStartDate, subscriptionEndDate } = data;

    // Determine start and end dates if not provided (e.g., start now, end in 1 month/year)
    const startDate = subscriptionStartDate ?? new Date();
    // Simple example: End date 1 year from start for non-trial, 14 days for trial
    // Replace with actual logic based on billing cycle
    let endDate = subscriptionEndDate;
    if (!endDate) {
        if (newTier === SubscriptionTier.TRIAL) {
            endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
        } else if (newTier !== SubscriptionTier.BASIC) { // Assuming BASIC might be free/no end date
            endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate()); // 1 year later
        }
    }

    try {
        // Use transaction to update practice and create history record atomically
        const updatedPractice = await prisma.$transaction(async (tx) => {
            const practice = await tx.practice.findUnique({ where: { id: practiceId } });
            if (!practice) {
                throw new AppError('Practice not found', 404);
            }

            // Update Practice record
            const updated = await tx.practice.update({
                where: { id: practiceId },
                data: {
                    subscriptionTier: newTier,
                    subscriptionStatus: newTier === SubscriptionTier.TRIAL ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
                    subscriptionStartDate: startDate,
                    subscriptionEndDate: endDate,
                    // Reset storage if needed based on tier?
                },
            });

            // Create Subscription History record
            await tx.subscriptionHistory.create({
                data: {
                    practiceId: practiceId,
                    tier: newTier,
                    startDate: startDate,
                    endDate: endDate,
                    amount: amount,
                    paymentId: paymentId,
                },
            });

            return updated;
        });

        return updatedPractice;

    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error(`Error updating subscription for practice ${practiceId}:`, error);
        throw new AppError('Could not update subscription due to an internal error', 500);
    }
};

/**
 * Retrieves the subscription history for a practice.
 * @param practiceId - ID of the practice.
 * @param options - Pagination options.
 * @returns List of subscription history records and pagination metadata.
 * @throws AppError on DB error.
 */
export const getSubscriptionHistory = async (
    practiceId: string,
    options: { limit?: number; page?: number } = {}
) => {
    const { limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;

    // Verify practice exists (optional, but good practice)
    const practiceExists = await prisma.practice.count({ where: { id: practiceId } });
    if (practiceExists === 0) {
        throw new AppError('Practice not found', 404);
    }

    try {
        const history = await prisma.subscriptionHistory.findMany({
            where: { practiceId },
            skip,
            take: limit,
            orderBy: {
                startDate: 'desc', // Show most recent changes first
            },
        });

        const totalHistory = await prisma.subscriptionHistory.count({ where: { practiceId } });

        return {
            history,
            pagination: {
                total: totalHistory,
                page,
                limit,
                totalPages: Math.ceil(totalHistory / limit),
            },
        };
    } catch (error) {
        console.error(`Error retrieving subscription history for practice ${practiceId}:`, error);
        throw new AppError('Could not retrieve subscription history due to an internal error', 500);
    }
};

// Placeholder function for initiating checkout - requires payment provider integration
export const createCheckoutSession = async (practiceId: string, tier: SubscriptionTier, userId: string) => {
    console.log(`Placeholder: Creating checkout session for practice ${practiceId}, tier ${tier}, user ${userId}`);
    // TODO: Implement Stripe (or other provider) checkout session creation
    // 1. Verify practice and user exist
    // 2. Determine price ID based on the selected tier
    // 3. Call Stripe API to create a session
    // 4. Return the session ID/URL to the client
    return { sessionId: 'placeholder_session_id', url: 'https://example.com/checkout' };
};

// Placeholder function for handling payment provider webhooks
export const handleWebhook = async (payload: any, signature: string) => {
    console.log('Placeholder: Handling webhook event');
    // TODO: Implement webhook verification and handling (e.g., Stripe)
    // 1. Verify webhook signature
    // 2. Parse event payload
    // 3. Handle events like 'checkout.session.completed', 'invoice.payment_succeeded', etc.
    // 4. If successful payment for a subscription, call updatePracticeSubscription
    // Example:
    // const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
    // if (event.type === 'checkout.session.completed') {
    //    const session = event.data.object;
    //    const practiceId = session.client_reference_id; // Assuming practiceId passed during checkout creation
    //    const tier = ... // Determine tier from session line items or metadata
    //    await updatePracticeSubscription(practiceId, { newTier: tier, paymentId: session.payment_intent, ... });
    // }
    return { received: true };
}; 