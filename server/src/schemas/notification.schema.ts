import { z } from 'zod';

// Schema for creating a notification (potentially manual creation)
// User ID (recipient) and content are key.
// Optional fields like type or related entity ID might be useful.
export const createNotificationSchema = z.object({
    body: z.object({
        userId: z.string().uuid('Recipient User ID is required'),
        title: z.string().min(1).max(100),
        message: z.string().min(1).max(1000),
        // Optional fields for categorization/linking
        type: z.string().max(50).optional(),
        relatedEntityId: z.string().uuid().optional(), // e.g., studyId, patientId
    }),
});

// Schema for listing notifications for the authenticated user
export const listNotificationsSchema = z.object({
    query: z.object({
        read: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
        limit: z.coerce.number().int().positive().optional().default(10),
        page: z.coerce.number().int().positive().optional().default(1),
    }).optional(),
});

// Schema for marking a notification as read
export const notificationParamsSchema = z.object({
    params: z.object({
        notificationId: z.string().uuid('Invalid notification ID format'),
    }),
});

// Type inference
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type NotificationParamsInput = z.infer<typeof notificationParamsSchema>; 