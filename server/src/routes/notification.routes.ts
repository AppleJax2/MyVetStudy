import express from 'express';
import {
    createNotification,
    getMyNotifications,
    markNotificationAsRead,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    createNotificationSchema,
    listNotificationsSchema,
    notificationParamsSchema
} from '../schemas/notification.schema';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Route to get notifications for the authenticated user
router.get(
    '/',
    validate(listNotificationsSchema), // Validates query params
    getMyNotifications
);

// Route to create a notification (potentially admin/internal only)
// TODO: Add authorization middleware here (e.g., authorize('ADMIN'))
router.post(
    '/',
    validate(createNotificationSchema),
    createNotification
);

// Route to mark a specific notification as read
router.patch(
    '/:notificationId/read', // Using PATCH and specific endpoint for marking as read
    validate(notificationParamsSchema),
    markNotificationAsRead
);

export default router; 