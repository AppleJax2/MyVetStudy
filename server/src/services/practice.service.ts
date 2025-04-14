import prisma from '../utils/prisma.client';
import { Practice, SubscriptionTier, SubscriptionStatus, Prisma } from '@prisma/client';
import AppError from '../utils/appError';

// TODO: Implement full practice service logic

/**
 * Finds a practice by its ID.
 * @param practiceId - The ID of the practice.
 * @returns The practice object or null if not found.
 */
export const findPracticeById = async (practiceId: string): Promise<Practice | null> => {
    try {
        const practice = await prisma.practice.findUnique({
            where: { id: practiceId },
        });
        return practice;
    } catch (error) {
        console.error(`Error finding practice by ID ${practiceId}:`, error);
        return null;
    }
};

/**
 * Updates practice settings
 * @param practiceId - ID of the practice to update
 * @param data - Data to update
 * @returns Updated practice object
 */
export const updatePracticeSettings = async (
    practiceId: string, 
    data: {
        name?: string;
        address?: string;
        phone?: string;
        email?: string;
        logo?: string;
        customBranding?: Record<string, any>;
    }
): Promise<Practice> => {
    try {
        // Verify practice exists
        const practice = await findPracticeById(practiceId);
        if (!practice) {
            throw new AppError('Practice not found', 404);
        }

        // Update practice
        const updatedPractice = await prisma.practice.update({
            where: { id: practiceId },
            data
        });

        return updatedPractice;
    } catch (error) {
        console.error(`Error updating practice settings for ${practiceId}:`, error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to update practice settings', 500);
    }
};

/**
 * Updates practice logo
 * @param practiceId - ID of the practice to update
 * @param logoUrl - URL of the uploaded logo
 * @returns Updated practice object
 */
export const updatePracticeLogo = async (
    practiceId: string,
    logoUrl: string
): Promise<Practice> => {
    return updatePracticeSettings(practiceId, { logo: logoUrl });
};

/**
 * Updates practice custom branding
 * @param practiceId - ID of the practice to update
 * @param branding - Custom branding object (colors, fonts, etc.)
 * @returns Updated practice object
 */
export const updatePracticeCustomBranding = async (
    practiceId: string,
    branding: Record<string, any>
): Promise<Practice> => {
    return updatePracticeSettings(practiceId, { customBranding: branding });
};

/**
 * Gets all staff members for a practice
 * @param practiceId - ID of the practice
 * @returns Array of practice staff members
 */
export const getPracticeStaff = async (practiceId: string) => {
    try {
        const staff = await prisma.user.findMany({
            where: {
                practiceId,
                isActive: true
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                role: 'asc'
            }
        });

        return staff;
    } catch (error) {
        console.error(`Error getting practice staff for ${practiceId}:`, error);
        throw new AppError('Failed to retrieve practice staff', 500);
    }
};

/**
 * Gets practice subscription information
 * @param practiceId - ID of the practice
 * @returns Subscription details
 */
export const getPracticeSubscription = async (practiceId: string) => {
    try {
        const practice = await prisma.practice.findUnique({
            where: { id: practiceId },
            select: {
                subscriptionTier: true,
                subscriptionStatus: true,
                subscriptionStartDate: true,
                subscriptionEndDate: true,
                maxStorage: true,
                currentStorage: true
            }
        });

        if (!practice) {
            throw new AppError('Practice not found', 404);
        }

        // Get subscription history
        const history = await prisma.subscriptionHistory.findMany({
            where: { practiceId },
            orderBy: { startDate: 'desc' },
            take: 5
        });

        return {
            current: practice,
            history
        };
    } catch (error) {
        console.error(`Error getting practice subscription for ${practiceId}:`, error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to retrieve practice subscription', 500);
    }
}; 