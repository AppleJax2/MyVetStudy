import prisma from '../utils/prisma.client';
import { Prisma, MonitoringPlanStatus, MonitoringPlanRole, SubscriptionTier } from '../generated/prisma';
import AppError from '../utils/appError';
import { findPracticeById } from './practice.service';

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
 * @param data - MonitoringPlan creation data (Validated Zod input body).
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
            // Return null if not found or doesn't belong to the practice
            return null;
        }

        return monitoringPlan;
    } catch (error) {
        console.error(`Error finding monitoring plan by ID ${monitoringPlanId} for practice ${practiceId}:`, error);
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
                throw new AppError('Cannot activate monitoring plan. Subscription limit for active monitoring plans reached.', 403);
            }
        }

        // 3. Perform the update
        // Ensure fields like createdById and practiceId are not accidentally updated
        const { createdById, practiceId: _, ...updateData } = data;

        const updatedMonitoringPlan = await prisma.monitoringPlan.update({
            where: {
                id: monitoringPlanId,
                // Practice ID check here is redundant due to the findFirst above, but can be added for safety
                // practiceId: practiceId,
            },
            data: updateData,
            // Optionally include relations if needed in the response
            // include: { ... }
        });

        return updatedMonitoringPlan;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle potential Prisma errors, e.g., unique constraint violation if any
            // if (error.code === 'P2002') { ... }
        }
        console.error(`Error updating monitoring plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not update monitoring plan due to an internal error', 500);
    }
};

/**
 * Deletes a monitoring plan.
 * Ensures monitoring plan exists and belongs to the practice before deletion.
 * @param monitoringPlanId - ID of the monitoring plan to delete.
 * @param practiceId - ID of the practice (for authorization).
 * @returns True if deletion was successful.
 * @throws AppError if monitoring plan not found, not authorized, or DB error.
 */
export const deleteMonitoringPlan = async (monitoringPlanId: string, practiceId: string): Promise<boolean> => {
    try {
        // Use deleteMany with where clause to ensure monitoring plan belongs to the practice
        // This atomically checks existence and deletes if matched.
        const deleteResult = await prisma.monitoringPlan.deleteMany({
            where: {
                id: monitoringPlanId,
                practiceId, // Authorization check
            },
        });

        // deleteMany returns a count of deleted records.
        // If count is 0, it means the monitoring plan wasn't found or didn't belong to the practice.
        if (deleteResult.count === 0) {
            throw new AppError('Monitoring Plan not found or you do not have permission to delete it', 404);
        }

        return true; // Deletion successful

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        // Handle potential Prisma errors (e.g., foreign key constraints if not handled by cascade deletes)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Example: Foreign key constraint violation
            if (error.code === 'P2003' || error.code === 'P2014') {
                 console.error(`Deletion failed due to related records for monitoring plan ${monitoringPlanId}:`, error);
                 // Depending on requirements, maybe try to soft delete or return a specific error
                 throw new AppError('Cannot delete monitoring plan because it has associated records (e.g., patients, observations). Archive it instead?', 409); // 409 Conflict
            }
        }
        console.error(`Error deleting monitoring plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not delete monitoring plan due to an internal error', 500);
    }
};

// --- Additional Management Functions ---

/**
 * Adds a patient to a specific monitoring plan.
 * Checks if monitoring plan and patient exist and belong to the same practice.
 * Checks for existing enrollment.
 * @param monitoringPlanId - ID of the monitoring plan.
 * @param patientId - ID of the patient.
 * @param practiceId - ID of the practice (for authorization).
 * @returns The created MonitoringPlanPatient record.
 * @throws AppError if monitoring plan/patient not found, not in the same practice, already enrolled, or DB error.
 */
export const addPatientToMonitoringPlanService = async (monitoringPlanId: string, patientId: string, practiceId: string) => {
    try {
        // 1. Verify monitoring plan exists and belongs to the practice
        const monitoringPlan = await prisma.monitoringPlan.findFirst({
            where: { id: monitoringPlanId, practiceId },
            select: { id: true, status: true }, // Select minimal fields
        });
        if (!monitoringPlan) {
            throw new AppError('Monitoring Plan not found or not associated with this practice', 404);
        }
        // Optional: Add check based on monitoring plan status (e.g., cannot add patients to COMPLETED monitoring plan)
        if ([MonitoringPlanStatus.COMPLETED, MonitoringPlanStatus.ARCHIVED].includes(monitoringPlan.status)) {
             throw new AppError(`Cannot add patient to a monitoring plan with status: ${monitoringPlan.status}`, 400);
        }

        // 2. Verify patient exists and belongs to the practice
        const patient = await prisma.patient.findFirst({
            where: { id: patientId, practiceId },
            select: { id: true }, // Select minimal fields
        });
        if (!patient) {
            throw new AppError('Patient not found or not associated with this practice', 404);
        }

        // 3. Check if patient is already enrolled in this monitoring plan
        const existingEnrollment = await prisma.monitoringPlanPatient.findUnique({
            where: {
                monitoringPlanId_patientId: { monitoringPlanId, patientId },
            },
        });
        if (existingEnrollment) {
            // If already enrolled but inactive, maybe reactivate? Or just throw error?
            // For now, throw error if any enrollment exists.
            throw new AppError('Patient is already enrolled in this monitoring plan', 409); // 409 Conflict
        }

        // 4. Create the MonitoringPlanPatient record (enrollment)
        const newEnrollment = await prisma.monitoringPlanPatient.create({
            data: {
                monitoringPlanId,
                patientId,
                // Default enrollment date is handled by Prisma schema (@default(now()))
                // Default isActive is true
            },
            // Include related data if needed in response
            include: {
                monitoringPlan: { select: { id: true, title: true } },
                patient: { select: { id: true, name: true } },
            }
        });

        return newEnrollment;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle potential DB errors (e.g., unique constraints - already checked above but good practice)
            // if (error.code === 'P2002') { ... }
        }
        console.error(`Error adding patient ${patientId} to monitoring plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not add patient to monitoring plan due to an internal error', 500);
    }
};

/**
 * Removes (or deactivates) a patient's enrollment from a monitoring plan.
 * Checks if enrollment exists and belongs to the practice (implicitly via monitoringPlanId/patientId).
 * @param monitoringPlanId - ID of the monitoring plan.
 * @param patientId - ID of the patient.
 * @param practiceId - ID of the practice (for authorization).
 * @returns True if removal was successful.
 * @throws AppError if enrollment not found, not authorized, or DB error.
 */
export const removePatientFromMonitoringPlanService = async (monitoringPlanId: string, patientId: string, practiceId: string): Promise<boolean> => {
    try {
        // 1. Verify the monitoring plan belongs to the practice (authorization check)
        const monitoringPlan = await prisma.monitoringPlan.findFirst({
            where: { id: monitoringPlanId, practiceId },
            select: { id: true }, // Select minimal fields
        });
        if (!monitoringPlan) {
            throw new AppError('Monitoring Plan not found or not associated with this practice', 404);
        }

        // 2. Verify the enrollment exists
        const enrollment = await prisma.monitoringPlanPatient.findUnique({
            where: {
                monitoringPlanId_patientId: { monitoringPlanId, patientId },
            },
        });
        if (!enrollment) {
            throw new AppError('Patient is not enrolled in this monitoring plan', 404);
        }

        // 3. Delete the enrollment
        // Alternative: Set isActive to false instead of deleting (soft delete)
        /*
        const updatedEnrollment = await prisma.monitoringPlanPatient.update({
            where: {
                monitoringPlanId_patientId: { monitoringPlanId, patientId },
            },
            data: {
                isActive: false,
                exitDate: new Date(), // Record when patient exited the monitoring plan
            },
        });
        */

        // Hard delete approach
        await prisma.monitoringPlanPatient.delete({
            where: {
                monitoringPlanId_patientId: { monitoringPlanId, patientId },
            },
        });

        return true; // Removal successful

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        // Handle potential Prisma errors (e.g., foreign key constraints if there are related observations)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003' || error.code === 'P2014') {
                 console.error(`Deletion failed due to related records for patient ${patientId} in monitoring plan ${monitoringPlanId}:`, error);
                 throw new AppError('Cannot remove patient from monitoring plan because it has associated records (e.g., observations). Deactivate instead?', 409);
            }
        }
        console.error(`Error removing patient ${patientId} from monitoring plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not remove patient from monitoring plan due to an internal error', 500);
    }
};

/**
 * Assigns a user to a monitoring plan with a specific role.
 * Checks if monitoring plan and user exist and belong to the correct practice.
 * Creates or updates the assignment record.
 * @param monitoringPlanId - ID of the monitoring plan.
 * @param userId - ID of the user being assigned.
 * @param role - Role to assign to the user in the monitoring plan.
 * @param practiceId - ID of the practice (for authorization).
 * @param assigningUserId - ID of the user performing the assignment (for authorization and audit).
 * @returns The created or updated assignment record.
 * @throws AppError if monitoring plan/user not found, not authorized, or DB error.
 */
export const assignUserToMonitoringPlanService = async (monitoringPlanId: string, userId: string, role: MonitoringPlanRole, practiceId: string, assigningUserId: string) => {
    try {
        // 1. Verify monitoring plan exists and belongs to the practice
        const monitoringPlan = await prisma.monitoringPlan.findFirst({
            where: { id: monitoringPlanId, practiceId },
            select: { id: true }, // Select minimal fields
        });
        if (!monitoringPlan) {
            throw new AppError('Monitoring Plan not found or not associated with this practice', 404);
        }

        // 2. Verify user exists and belongs to the practice
        const user = await prisma.user.findFirst({
            where: { id: userId, practiceId },
            select: { id: true, role: true }, // Include the role for potential checks
        });
        if (!user) {
            throw new AppError('User not found or not associated with this practice', 404);
        }

        // 3. Optionally check if role is valid for the user's system role
        // Example: Maybe only VETERINARIANs can be assigned as LEAD_RESEARCHER
        // Could be implemented if requirements specify role restrictions

        // 4. Create or update the assignment
        const assignment = await prisma.monitoringPlanAssignment.upsert({
            where: {
                monitoringPlanId_userId: { monitoringPlanId, userId },
            },
            update: {
                role, // Update role if assignment already exists
                // Could add update tracking, e.g., updatedAt (Prisma handles @updatedAt), updatedBy, etc.
            },
            create: {
                monitoringPlanId,
                userId,
                role,
                // assignedById: assigningUserId, // Optional: track who assigned (need to add column)
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true },
                },
                monitoringPlan: {
                    select: { id: true, title: true },
                },
            },
        });

        return assignment;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle specific Prisma errors
        }
        console.error(`Error assigning user ${userId} to monitoring plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not assign user to monitoring plan due to an internal error', 500);
    }
};

/**
 * Unassigns a user from a monitoring plan.
 * Checks if assignment exists and the monitoring plan belongs to the correct practice.
 * @param monitoringPlanId - ID of the monitoring plan.
 * @param userId - ID of the user being unassigned.
 * @param practiceId - ID of the practice (for authorization).
 * @param assigningUserId - ID of the user performing the unassignment (for authorization and audit).
 * @returns True if unassignment was successful.
 * @throws AppError if assignment not found, not authorized, or DB error.
 */
export const unassignUserFromMonitoringPlanService = async (monitoringPlanId: string, userId: string, practiceId: string, assigningUserId: string): Promise<boolean> => {
    try {
        // 1. Verify the monitoring plan belongs to the practice (authorization check)
        const monitoringPlan = await prisma.monitoringPlan.findFirst({
            where: { id: monitoringPlanId, practiceId },
            select: { id: true }, // Select minimal fields
        });
        if (!monitoringPlan) {
            throw new AppError('Monitoring Plan not found or not associated with this practice', 404);
        }

        // 2. Verify the assignment exists
        const assignment = await prisma.monitoringPlanAssignment.findUnique({
            where: {
                monitoringPlanId_userId: { monitoringPlanId, userId },
            },
        });
        if (!assignment) {
            throw new AppError('User is not assigned to this monitoring plan', 404);
        }

        // 3. Check if the assigning user has permission to unassign
        // This could be based on the assigning user's role, comparing the assigning user to user being unassigned
        // For now, just allow the action based on practice association (already checked)

        // 4. Delete the assignment
        await prisma.monitoringPlanAssignment.delete({
            where: {
                monitoringPlanId_userId: { monitoringPlanId, userId },
            },
        });

        return true; // Unassignment successful

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        // Handle potential Prisma errors
        console.error(`Error unassigning user ${userId} from monitoring plan ${monitoringPlanId}:`, error);
        throw new AppError('Could not unassign user from monitoring plan due to an internal error', 500);
    }
}; 