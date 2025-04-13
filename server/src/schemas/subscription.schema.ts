import { z } from 'zod';
import { SubscriptionTier, SubscriptionStatus } from '../generated/prisma';

// Schema for updating a Practice's subscription tier
// This would likely be triggered *after* a successful payment event from a provider like Stripe.
export const updateSubscriptionSchema = z.object({
    params: z.object({
        practiceId: z.string().uuid('Invalid practice ID format'),
    }),
    body: z.object({
        newTier: z.nativeEnum(SubscriptionTier),
        // Optional fields that might come from payment provider webhook
        paymentId: z.string().optional(),
        amount: z.number().positive().optional(),
        subscriptionStartDate: z.coerce.date().optional(), // Usually set by the system
        subscriptionEndDate: z.coerce.date().optional(), // Usually set by the system based on tier/payment
    }),
});

// Schema for getting subscription details for a practice
export const getSubscriptionSchema = z.object({
    params: z.object({
        practiceId: z.string().uuid('Invalid practice ID format'),
    }),
});

// Schema for listing subscription history for a practice
export const listSubscriptionHistorySchema = z.object({
    params: z.object({
        practiceId: z.string().uuid('Invalid practice ID format'),
    }),
    query: z.object({
        limit: z.coerce.number().int().positive().optional().default(10),
        page: z.coerce.number().int().positive().optional().default(1),
    }).optional(),
});

// Type inference
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type GetSubscriptionInput = z.infer<typeof getSubscriptionSchema>;
export type ListSubscriptionHistoryInput = z.infer<typeof listSubscriptionHistorySchema>;

// TODO: Add schema for initiating a checkout session (to interact with payment provider) 