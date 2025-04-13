import prisma from '../utils/prisma.client';
import { Prisma, Notification } from '../generated/prisma';
import AppError from '../utils/appError';

// TODO: Add detailed logging
// TODO: Implement event-driven notification creation (e.g., on study assignment)

/**
 * Creates a new notification for a user.
 * This is likely used internally by other services or for manual admin creation.
 * @param data - Notification details.
 * @returns The created notification.
 * @throws AppError on DB error or if recipient user doesn't exist.
 */
export const createNotification = async (
    data: Prisma.NotificationCreateInput
): Promise<Notification> => {
    try {
        // Optionally verify recipient user exists before creating
        const userExists = await prisma.user.count({ where: { id: data.user.connect?.id } });
        if (userExists === 0) {
            throw new AppError('Recipient user not found', 404);
        }

        const notification = await prisma.notification.create({ data });
        return notification;
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error(`Error creating notification for user ${data.user.connect?.id}:`, error);
        throw new AppError('Could not create notification due to an internal error', 500);
    }
};

/**
 * Finds notifications for a specific user, with optional filtering and pagination.
 * @param userId - The ID of the user whose notifications to retrieve.
 * @param options - Filtering (read status) and pagination options.
 * @returns List of notifications and pagination metadata.
 * @throws AppError on DB error.
 */
export const findNotificationsByUser = async (
    userId: string,
    options: { read?: boolean; limit?: number; page?: number } = {}
) => {
    const { read, limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
        userId,
    };

    if (read !== undefined) {
        where.isRead = read;
    }

    try {
        const notifications = await prisma.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc', // Show newest first
            },
        });

        const totalNotifications = await prisma.notification.count({ where });

        return {
            notifications,
            pagination: {
                total: totalNotifications,
                page,
                limit,
                totalPages: Math.ceil(totalNotifications / limit),
            },
        };
    } catch (error) {
        console.error(`Error finding notifications for user ${userId}:`, error);
        throw new AppError('Could not retrieve notifications due to an internal error', 500);
    }
};

/**
 * Marks a specific notification as read for a user.
 * Ensures the notification belongs to the requesting user.
 * @param notificationId - The ID of the notification to mark as read.
 * @param userId - The ID of the user requesting the action.
 * @returns The updated notification.
 * @throws AppError if notification not found, not owned by user, or DB error.
 */
export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<Notification> => {
    try {
        // Use updateMany to atomically check ownership and update
        const updateResult = await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId: userId, // Ensure notification belongs to the user
                isRead: false, // Only update if it's not already read
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        if (updateResult.count === 0) {
            // Could be not found, already read, or doesn't belong to user
            // Check if it exists at all for a more specific error
            const exists = await prisma.notification.findFirst({
                where: { id: notificationId, userId: userId }
            });
            if (!exists) {
                 throw new AppError('Notification not found or does not belong to you', 404);
            }
            // If it exists but count is 0, it was likely already read
            // Return the existing notification instead of throwing error
             const alreadyReadNotification = await prisma.notification.findUnique({ where: { id: notificationId }});
             if(!alreadyReadNotification) throw new AppError('Notification not found', 404); // Should not happen
             return alreadyReadNotification;

            // Previous logic: throw new AppError('Notification not found, does not belong to you, or already marked as read', 404);
        }

        // Fetch the updated notification to return it
        const updatedNotification = await prisma.notification.findUnique({ where: { id: notificationId } });
        if (!updatedNotification) { // Should not happen if updateResult.count > 0
             throw new AppError('Failed to retrieve updated notification', 500);
        }
        return updatedNotification;

    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error(`Error marking notification ${notificationId} as read for user ${userId}:`, error);
        throw new AppError('Could not mark notification as read due to an internal error', 500);
    }
}; 