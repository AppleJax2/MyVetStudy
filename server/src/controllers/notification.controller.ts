import { Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
    CreateNotificationInput,
    ListNotificationsInput,
    NotificationParamsInput
} from '../schemas/notification.schema';
import AppError from '../utils/appError';

// TODO: Add detailed logging

// Controller to create a Notification (likely admin/internal use)
export const createNotification = async (
    req: AuthenticatedRequest<{}, {}, CreateNotificationInput['body']>,
    res: Response,
    next: NextFunction
) => {
    try {
        // TODO: Add permission checks - who can create notifications for others?
        const { userId, title, message, type, relatedEntityId } = req.body;

        const notificationData = {
            title,
            message,
            type,
            relatedEntityId,
            user: { connect: { id: userId } },
            // isRead defaults to false, readAt defaults to null
        };

        const newNotification = await notificationService.createNotification(notificationData);

        res.status(201).json({
            status: 'success',
            message: 'Notification created successfully',
            data: newNotification,
        });
    } catch (error) {
        next(error);
    }
};

// Controller to get notifications for the authenticated user
export const getMyNotifications = async (
    req: AuthenticatedRequest<{}, ListNotificationsInput['query']>, // Query params for filtering/pagination
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.id;
        const query = req.query;

        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }

        const options = {
            read: query?.read,
            limit: query?.limit,
            page: query?.page,
        };

        const result = await notificationService.findNotificationsByUser(userId, options);

        res.status(200).json({
            status: 'success',
            results: result.notifications.length,
            pagination: result.pagination,
            data: result.notifications,
        });
    } catch (error) {
        next(error);
    }
};

// Controller to mark a notification as read
export const markNotificationAsRead = async (
    req: AuthenticatedRequest<NotificationParamsInput['params']>, // Notification ID from params
    res: Response,
    next: NextFunction
) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }

        const updatedNotification = await notificationService.markNotificationAsRead(notificationId, userId);

        res.status(200).json({
            status: 'success',
            message: 'Notification marked as read',
            data: updatedNotification,
        });
    } catch (error) {
        next(error);
    }
}; 