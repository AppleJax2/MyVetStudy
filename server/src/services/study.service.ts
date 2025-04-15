import prisma from '../utils/prisma.client';
import { Prisma, MonitoringPlanStatus, MonitoringPlanRole, SubscriptionTier } from '@prisma/client';
import AppError from '../utils/appError'; // Assuming AppError utility exists
import { findPracticeById } from './practice.service'; // Assuming practice service exists

// TODO: Implement detailed error handling, logging, and access control checks

/**
 * Checks if a practice can create another monitoring plan based on its subscription tier.
 * @param practiceId - ID of the practice.
 * @param currentActiveMonitoringPlans - Number of currently active monitoring plans.
 * @returns True if the practice can create a new monitoring plan, false otherwise.
 */
const canCreateMonitoringPlan = async (practiceId: string, currentActiveMonitoringPlans: number): Promise<boolean> => {
    const practice = await findPracticeById(practiceId);
    if (!practice) {
        throw new AppError('Practice not found', 404);
    }

    // Check subscription status (only active or trial allowed)
    if (practice.subscriptionStatus !== 'ACTIVE' && practice.subscriptionStatus !== 'TRIAL') {
        // Allow DRAFT monitoring plans even if subscription is inactive/expired?
        // For now, strict check: only Active/Trial can create *any* new monitoring plan.
        return false;
    }

    switch (practice.subscriptionTier) {
        case SubscriptionTier.BASIC:
            return currentActiveMonitoringPlans < 5;
        case SubscriptionTier.STANDARD:
            return currentActiveMonitoringPlans < 20;
        case SubscriptionTier.PREMIUM:
        case SubscriptionTier.TRIAL: // Trial gives premium access
            return true; // Unlimited
        default:
            return false; // Should not happen
    }
};

/**
 * Creates a new monitoring plan, checking subscription limits.
 * @param data - Monitoring Plan creation data (Validated Zod input body).
 * @param userId - ID of the user creating the monitoring plan.
 * @param practiceId - ID of the practice the monitoring plan belongs to.
 * @returns The created monitoring plan.
 * @throws AppError if practice not found, subscription limits exceeded, or database error occurs.
 */
export const createMonitoringPlan = async (data: Omit<Prisma.MonitoringPlanCreateInput, 'createdBy' | 'practice' | 'practiceId' | 'createdById'>, userId: string, practiceId: string) => {
    try {
        // Count current active monitoring plans for the practice
        const activeMonitoringPlansCount = await prisma.monitoringPlan.count({
            where: {
                practiceId,
                status: MonitoringPlanStatus.ACTIVE, // Only count ACTIVE monitoring plans against the limit
            },
        });

        // Check subscription limits before creating
        const allowedToCreate = await canCreateMonitoringPlan(practiceId, activeMonitoringPlansCount);
        // Only block creation/update to ACTIVE status if limit is reached.
        if (!allowedToCreate && (data.status === MonitoringPlanStatus.ACTIVE)) {
            throw new AppError('Subscription limit for active monitoring plans reached. Upgrade required.', 403);
        }

        // Prepare data for Prisma create
        const createData: Prisma.MonitoringPlanCreateInput = {
            ...data, // Spread the validated input data (title, description, etc.)
            practice: { connect: { id: practiceId } },
            createdBy: { connect: { id: userId } },
            // Ensure default status if not provided, defaulting to DRAFT
            status: data.status ?? MonitoringPlanStatus.DRAFT,
        };

        // Proceed with creation
        const monitoringPlan = await prisma.monitoringPlan.create({ data: createData });
        return monitoringPlan;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw known application errors
        }
        // Log the unexpected error
        console.error('Error creating monitoring plan:', error);
        // Throw a generic error
        throw new AppError('Could not create monitoring plan due to an internal error', 500);
    }
};

/**
 * Finds monitoring plans associated with a practice, with optional filtering and pagination.
 * @param practiceId - ID of the practice.
 * @param options - Optional query parameters (e.g., status, search, limit, page).
 * @returns A list of monitoring plans and pagination metadata.
 */
export const findMonitoringPlansByPractice = async (practiceId: string, options: { status?: MonitoringPlanStatus; search?: string; limit?: number; page?: number } = {}) => {
    const { status, search, limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.MonitoringPlanWhereInput = {
        practiceId,
    };

    if (status) {
        where.status = status;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            // Add other searchable fields if necessary
        ];
    }

    try {
        const monitoringPlans = await prisma.monitoringPlan.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                updatedAt: 'desc', // Default order by most recently updated
            },
            // Optionally include related data counts or specific fields
            // include: { _count: { select: { patients: true, assignedUsers: true } } }
        });

        const totalMonitoringPlans = await prisma.monitoringPlan.count({ where });

        return {
            monitoringPlans,
            pagination: {
                total: totalMonitoringPlans,
                page,
                limit,
                totalPages: Math.ceil(totalMonitoringPlans / limit),
            },
        };
    } catch (error) {
        console.error('Error finding monitoring plans for practice:', practiceId, error);
        throw new AppError('Could not retrieve monitoring plans due to an internal error', 500);
    }
};

/**
 * Finds a specific monitoring plan by its ID, ensuring it belongs to the correct practice.
 * Includes related data like patients and assigned users.
 * @param monitoringPlanId - ID of the monitoring plan.
 * @param practiceId - ID of the practice (for authorization).
 * @returns The monitoring plan object or null if not found or not belonging to the practice.
 */
export const findMonitoringPlanById = async (monitoringPlanId: string, practiceId: string) => {
    try {
        const monitoringPlan = await prisma.monitoringPlan.findFirst({
            where: {
                id: monitoringPlanId,
                practiceId, // Crucial: Ensure monitoring plan belongs to the requesting user's practice
            },
            // Include related data needed for displaying the monitoring plan details
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true }, // Select only necessary user fields
                },
                patients: {
                    // Include patient details within the MonitoringPlanPatient link
                    include: {
                        patient: {
                            select: { id: true, name: true, species: true, breed: true }, // Select necessary patient fields
                        },
                    },
                    where: { isActive: true }, // Optionally filter included relations
                },
                assignedUsers: {
                    // Include user details within the MonitoringPlanAssignment link
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, role: true }, // Select necessary user fields
                        },
                    },
                },
                symptomTemplates: true, // Include associated symptom templates
                treatmentTemplates: true, // Include associated treatment templates
                notes: {
                    orderBy: { createdAt: 'desc' }, // Order notes, newest first
                },
                // Add other relations as needed
            },
        });

        if (!monitoringPlan) {
            return null;
        }

        return monitoringPlan;
    } catch (error) {
        console.error(`Error finding monitoring plan ${monitoringPlanId} for practice ${practiceId}:`, error);
        throw new AppError('Could not retrieve monitoring plan details due to an internal error', 500);
    }
};

/**
 * Updates an existing monitoring plan.
 * Ensures monitoring plan exists and belongs to the practice before updating.
 * Handles potential subscription limit issues if changing status to ACTIVE.
 * @param monitoringPlanId - ID of the monitoring plan to update.
 * @param data - Update data (Validated Zod input body).
 * @param practiceId - ID of the practice (for authorization).
 * @returns The updated monitoring plan object.
 * @throws AppError if monitoring plan not found, not authorized, subscription limits exceeded, or DB error.
 */
export const updateMonitoringPlan = async (
    monitoringPlanId: string,
    data: Partial<Omit<Prisma.MonitoringPlanUpdateInput, 'createdBy' | 'practice'> & { status?: MonitoringPlanStatus }>,
    practiceId: string
) => {
    try {
        // 1. Verify the monitoring plan exists and belongs to the practice
        const existingMonitoringPlan = await prisma.monitoringPlan.findFirst({
            where: {
                id: monitoringPlanId,
                practiceId,
            },
            select: { status: true }, // Select only the current status for checks
        });

        if (!existingMonitoringPlan) {
            throw new AppError('Monitoring Plan not found or you do not have permission to update it', 404);
        }

        // 2. Check subscription limits IF the status is being changed to ACTIVE
        if (data.status === MonitoringPlanStatus.ACTIVE && existingMonitoringPlan.status !== MonitoringPlanStatus.ACTIVE) {
            const activeMonitoringPlansCount = await prisma.monitoringPlan.count({
                where: {
                    practiceId,
                    status: MonitoringPlanStatus.ACTIVE,
                },
            });
            // Use the same limit checking logic as in createMonitoringPlan
            const allowedToActivate = await canCreateMonitoringPlan(practiceId, activeMonitoringPlansCount);
            if (!allowedToActivate) {
                throw new AppError('Cannot activate monitoring plan. Subscription limit for active plans reached.', 403);
            }
        }

        // 3. Perform the update
        // Ensure fields like createdById and practiceId are not accidentally updated
        const { createdById, practiceId: _, ...updateData } = data;

        const updatedMonitoringPlan = await prisma.monitoringPlan.update({
            where: { id: monitoringPlanId },
            data: updateData,
        });

        return updatedMonitoringPlan;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error(`Error updating monitoring plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not update monitoring plan due to an internal error', 500);
    }
};

/**
 * Deletes a monitoring plan (soft delete or hard delete based on policy).
 * Ensures monitoring plan exists and belongs to the practice.
 * @param monitoringPlanId - ID of the monitoring plan to delete.
 * @param practiceId - ID of the practice (for authorization).
 * @returns True if deletion was successful.
 * @throws AppError if monitoring plan not found, not authorized, or DB error.
 */
export const deleteMonitoringPlan = async (monitoringPlanId: string, practiceId: string) => {
    try {
        // Verify the monitoring plan exists and belongs to the practice
        const monitoringPlanCheck = await prisma.monitoringPlan.count({
            where: { id: monitoringPlanId, practiceId },
        });

        if (monitoringPlanCheck === 0) {
            throw new AppError('Monitoring Plan not found or you do not have permission to delete it', 404);
        }

        // Perform the delete (consider soft delete: update status to ARCHIVED/DELETED)
        // For hard delete:
        // TODO: Handle cascading deletes or related data constraints properly.
        // Example: delete related assignments, patient enrollments first if needed.
        await prisma.monitoringPlanPatient.deleteMany({ where: { monitoringPlanId } });
        await prisma.monitoringPlanAssignment.deleteMany({ where: { monitoringPlanId } });
        // ... delete other related data ...
        const deleteResult = await prisma.monitoringPlan.delete({
            where: { id: monitoringPlanId },
        });

        return deleteResult;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle specific Prisma errors, e.g., foreign key constraints
            console.error('Prisma error deleting monitoring plan:', error.code, error.message);
            throw new AppError(`Could not delete monitoring plan due to related data (Error ${error.code})`, 409); // 409 Conflict
        }
        if (error instanceof AppError) {
            throw error;
        }
        console.error(`Error deleting monitoring plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not delete monitoring plan due to an internal error', 500);
    }
};

/**
 * Enrolls a patient into a monitoring plan.
 * Checks if plan and patient exist and belong to the practice.
 * @param monitoringPlanId - ID of the monitoring plan.
 * @param patientId - ID of the patient.
 * @param practiceId - ID of the practice (for authorization).
 * @returns The MonitoringPlanPatient enrollment record.
 * @throws AppError if plan/patient not found, already enrolled, or DB error.
 */
export const enrollPatientInMonitoringPlan = async (monitoringPlanId: string, patientId: string, practiceId: string) => {
    try {
        // Verify monitoring plan exists and belongs to practice
        const planCheck = await prisma.monitoringPlan.count({ where: { id: monitoringPlanId, practiceId } });
        if (planCheck === 0) {
            throw new AppError('Monitoring Plan not found or not associated with this practice', 404);
        }

        // Verify patient exists and belongs to practice
        const patientCheck = await prisma.patient.count({ where: { id: patientId, practiceId } });
        if (patientCheck === 0) {
            throw new AppError('Patient not found or not associated with this practice', 404);
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.monitoringPlanPatient.findUnique({
            where: { monitoringPlanId_patientId: { monitoringPlanId, patientId } },
        });

        if (existingEnrollment) {
            // If inactive, reactivate? Or throw error?
            if (existingEnrollment.isActive) {
                throw new AppError('Patient is already enrolled in this monitoring plan', 409);
            } else {
                // Optionally reactivate: update isActive to true and return existingEnrollment
                const updatedEnrollment = await prisma.monitoringPlanPatient.update({
                    where: { id: existingEnrollment.id },
                    data: { isActive: true, exitDate: null }
                });
                return updatedEnrollment;
            }
        }

        // Create the enrollment record
        const enrollment = await prisma.monitoringPlanPatient.create({
            data: {
                monitoringPlan: { connect: { id: monitoringPlanId } },
                patient: { connect: { id: patientId } },
                isActive: true,
            },
        });

        return enrollment;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error(`Error enrolling patient ${patientId} in plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not enroll patient due to an internal error', 500);
    }
};

/**
 * Removes (or deactivates) a patient's enrollment from a monitoring plan.
 * Checks if enrollment exists and belongs to the practice (implicitly via monitoringPlanId/patientId).
 * @param monitoringPlanId - ID of the monitoring plan.
 * @param patientId - ID of the patient.
 * @param practiceId - ID of the practice (for authorization check on monitoring plan/patient).
 * @returns True if removal/deactivation was successful.
 * @throws AppError if enrollment not found, or DB error.
 */
export const removePatientFromMonitoringPlan = async (monitoringPlanId: string, patientId: string, practiceId: string) => {
    try {
        // We need to ensure the requestor has rights via the practiceId,
        // but the delete itself only needs the composite key.
        // First, verify the monitoring plan belongs to the practice to prevent unauthorized access
        const planCheck = await prisma.monitoringPlan.count({
            where: { id: monitoringPlanId, practiceId }
        });
        if (planCheck === 0) {
             throw new AppError('Monitoring Plan not found or not associated with this practice', 404);
        }
        // Optionally, verify patient also belongs to practice (though plan check often suffices)
        // const patientCheck = await prisma.patient.count({ where: { id: patientId, practiceId }});
        // if (patientCheck === 0) { ... }

        // Attempt to delete the MonitoringPlanPatient record
        // Using deleteMany ensures it only deletes if the combo exists.
        const deleteResult = await prisma.monitoringPlanPatient.deleteMany({
            where: {
                monitoringPlanId: monitoringPlanId,
                patientId: patientId,
                // We don't need practiceId here as the monitoringPlanId implicitly links to the practice
                // and we already verified the monitoring plan belongs to the practice.
            },
        });

        // If count is 0, the enrollment didn't exist.
        if (deleteResult.count === 0) {
            throw new AppError('Patient enrollment in this monitoring plan not found', 404);
        }

        return true;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error(`Error removing patient ${patientId} from plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not remove patient from monitoring plan due to an internal error', 500);
    }
};

/**
 * Assigns a user (staff member) to a monitoring plan with a specific role.
 * @param monitoringPlanId - ID of the monitoring plan.
 * @param userId - ID of the user to assign.
 * @param role - Role of the user in the monitoring plan.
 * @param practiceId - ID of the practice (for authorization).
 * @returns The MonitoringPlanAssignment record.
 * @throws AppError if plan/user not found, user not part of practice, or DB error.
 */
export const assignUserToMonitoringPlan = async (monitoringPlanId: string, userId: string, role: MonitoringPlanRole, practiceId: string) => {
    try {
        // Verify monitoring plan exists and belongs to practice
        const planCheck = await prisma.monitoringPlan.count({ where: { id: monitoringPlanId, practiceId } });
        if (planCheck === 0) {
            throw new AppError('Monitoring Plan not found or not associated with this practice', 404);
        }

        // Verify user exists and belongs to the same practice
        const userCheck = await prisma.user.count({ where: { id: userId, practiceId } });
        if (userCheck === 0) {
            throw new AppError('User not found or not part of this practice', 404);
        }

        // Check if already assigned
        const existingAssignment = await prisma.monitoringPlanAssignment.findUnique({
            where: { monitoringPlanId_userId: { monitoringPlanId, userId } }
        });

        if (existingAssignment) {
            // If role is different, update it?
            if (existingAssignment.role !== role) {
                const updatedAssignment = await prisma.monitoringPlanAssignment.update({
                    where: { id: existingAssignment.id },
                    data: { role },
                });
                return updatedAssignment;
            } else {
                return existingAssignment; // Already assigned with the same role
            }
        }

        // Create assignment
        const assignment = await prisma.monitoringPlanAssignment.create({
            data: {
                monitoringPlan: { connect: { id: monitoringPlanId } },
                user: { connect: { id: userId } },
                role: role,
            },
        });

        return assignment;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error(`Error assigning user ${userId} to plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not assign user to monitoring plan due to an internal error', 500);
    }
};

/**
 * Removes a user assignment from a monitoring plan.
 * @param monitoringPlanId - ID of the monitoring plan.
 * @param userId - ID of the user to remove.
 * @param practiceId - ID of the practice (for authorization).
 * @returns True if removal was successful.
 * @throws AppError if assignment not found or DB error.
 */
export const removeUserFromMonitoringPlan = async (monitoringPlanId: string, userId: string, practiceId: string) => {
    try {
        // Verify monitoring plan exists and belongs to practice
        const planCheck = await prisma.monitoringPlan.count({ where: { id: monitoringPlanId, practiceId } });
        if (planCheck === 0) {
            throw new AppError('Monitoring Plan not found or not associated with this practice', 404);
        }

        // Attempt to delete the assignment
        const deleteResult = await prisma.monitoringPlanAssignment.deleteMany({
            where: {
                monitoringPlanId: monitoringPlanId,
                userId: userId,
            },
        });

        if (deleteResult.count === 0) {
            throw new AppError('User assignment for this monitoring plan not found', 404);
        }

        return true;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error(`Error removing user ${userId} from plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not remove user from monitoring plan due to an internal error', 500);
    }
};

/**
 * Generates a unique share token for a monitoring plan.
 * @param monitoringPlanId - ID of the monitoring plan.
 * @param practiceId - ID of the practice (for authorization).
 * @returns The generated share token.
 * @throws AppError if plan not found or DB error.
 */
export const generateShareToken = async (monitoringPlanId: string, practiceId: string): Promise<string> => {
    try {
        const plan = await findMonitoringPlanById(monitoringPlanId, practiceId);
        if (!plan) {
            throw new AppError('Monitoring Plan not found', 404);
        }

        const shareToken = `${monitoringPlanId}-${Date.now().toString(36)}`; // Simple token generation
        
        await prisma.monitoringPlan.update({
            where: { id: monitoringPlanId },
            data: { shareToken },
        });

        return shareToken;
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error(`Error generating share token for plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not generate share token due to an internal error', 500);
    }
};

/**
 * Finds a monitoring plan by its share token.
 * @param token - The share token.
 * @returns The monitoring plan object or null if not found.
 * @throws AppError on DB error.
 */
export const findMonitoringPlanByShareToken = async (token: string) => {
    try {
        const monitoringPlan = await prisma.monitoringPlan.findUnique({
            where: { shareToken: token },
            include: { 
                symptomTemplates: true, 
                practice: { select: { name: true, logo: true } } // Include practice details
            }
        });
        return monitoringPlan;
    } catch (error) {
        console.error(`Error finding monitoring plan by share token ${token}:`, error);
        throw new AppError('Could not retrieve monitoring plan by share token due to an internal error', 500);
    }
}; 