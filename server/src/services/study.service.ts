import prisma from '../utils/prisma.client';
import { Prisma, StudyStatus, StudyRole, SubscriptionTier } from '../generated/prisma';
import AppError from '../utils/appError'; // Assuming AppError utility exists
import { findPracticeById } from './practice.service'; // Assuming practice service exists

// TODO: Implement detailed error handling, logging, and access control checks

/**
 * Checks if a practice can create another study based on its subscription tier.
 * @param practiceId - ID of the practice.
 * @param currentActiveStudies - Number of currently active studies.
 * @returns True if the practice can create a new study, false otherwise.
 */
const canCreateStudy = async (practiceId: string, currentActiveStudies: number): Promise<boolean> => {
    const practice = await findPracticeById(practiceId);
    if (!practice) {
        throw new AppError('Practice not found', 404);
    }

    // Check subscription status (only active or trial allowed)
    if (practice.subscriptionStatus !== 'ACTIVE' && practice.subscriptionStatus !== 'TRIAL') {
        // Allow DRAFT studies even if subscription is inactive/expired?
        // For now, strict check: only Active/Trial can create *any* new study.
        return false;
    }

    switch (practice.subscriptionTier) {
        case SubscriptionTier.BASIC:
            return currentActiveStudies < 5;
        case SubscriptionTier.STANDARD:
            return currentActiveStudies < 20;
        case SubscriptionTier.PREMIUM:
        case SubscriptionTier.TRIAL: // Trial gives premium access
            return true; // Unlimited
        default:
            return false; // Should not happen
    }
};

/**
 * Creates a new study, checking subscription limits.
 * @param data - Study creation data (Validated Zod input body).
 * @param userId - ID of the user creating the study.
 * @param practiceId - ID of the practice the study belongs to.
 * @returns The created study.
 * @throws AppError if practice not found, subscription limits exceeded, or database error occurs.
 */
export const createStudy = async (data: Omit<Prisma.StudyCreateInput, 'createdBy' | 'practice' | 'practiceId' | 'createdById'>, userId: string, practiceId: string) => {
    try {
        // Count current active studies for the practice
        const activeStudiesCount = await prisma.study.count({
            where: {
                practiceId,
                status: StudyStatus.ACTIVE, // Only count ACTIVE studies against the limit
            },
        });

        // Check subscription limits before creating
        const allowedToCreate = await canCreateStudy(practiceId, activeStudiesCount);
        // Only block creation/update to ACTIVE status if limit is reached.
        if (!allowedToCreate && (data.status === StudyStatus.ACTIVE)) {
            throw new AppError('Subscription limit for active studies reached. Upgrade required.', 403);
        }

        // Prepare data for Prisma create
        const createData: Prisma.StudyCreateInput = {
            ...data, // Spread the validated input data (title, description, etc.)
            practice: { connect: { id: practiceId } },
            createdBy: { connect: { id: userId } },
            // Ensure default status if not provided, defaulting to DRAFT
            status: data.status ?? StudyStatus.DRAFT,
        };

        // Proceed with creation
        const study = await prisma.study.create({ data: createData });
        return study;
    } catch (error) {
        if (error instanceof AppError) {
            throw error; // Re-throw known application errors
        }
        // Log the unexpected error
        console.error('Error creating study:', error);
        // Throw a generic error
        throw new AppError('Could not create study due to an internal error', 500);
    }
};

/**
 * Finds studies associated with a practice, with optional filtering and pagination.
 * @param practiceId - ID of the practice.
 * @param options - Optional query parameters (e.g., status, search, limit, page).
 * @returns A list of studies and pagination metadata.
 */
export const findStudiesByPractice = async (practiceId: string, options: { status?: StudyStatus; search?: string; limit?: number; page?: number } = {}) => {
    const { status, search, limit = 10, page = 1 } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.StudyWhereInput = {
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
        const studies = await prisma.study.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                updatedAt: 'desc', // Default order by most recently updated
            },
            // Optionally include related data counts or specific fields
            // include: { _count: { select: { patients: true, assignedUsers: true } } }
        });

        const totalStudies = await prisma.study.count({ where });

        return {
            studies,
            pagination: {
                total: totalStudies,
                page,
                limit,
                totalPages: Math.ceil(totalStudies / limit),
            },
        };
    } catch (error) {
        console.error('Error finding studies for practice:', practiceId, error);
        throw new AppError('Could not retrieve studies due to an internal error', 500);
    }
};

/**
 * Finds a specific study by its ID, ensuring it belongs to the correct practice.
 * Includes related data like patients and assigned users.
 * @param studyId - ID of the study.
 * @param practiceId - ID of the practice (for authorization).
 * @returns The study object or null if not found or not belonging to the practice.
 */
export const findStudyById = async (studyId: string, practiceId: string) => {
    try {
        const study = await prisma.study.findFirst({
            where: {
                id: studyId,
                practiceId, // Crucial: Ensure study belongs to the requesting user's practice
            },
            // Include related data needed for displaying the study details
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true }, // Select only necessary user fields
                },
                patients: {
                    // Include patient details within the StudyPatient link
                    include: {
                        patient: {
                            select: { id: true, name: true, species: true, breed: true }, // Select necessary patient fields
                        },
                    },
                    where: { isActive: true }, // Optionally filter included relations
                },
                assignedUsers: {
                    // Include user details within the StudyAssignment link
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

        if (!study) {
            // Return null if not found or doesn't belong to the practice
            return null;
        }

        return study;
    } catch (error) {
        console.error(`Error finding study by ID ${studyId} for practice ${practiceId}:`, error);
        throw new AppError('Could not retrieve study details due to an internal error', 500);
    }
};

/**
 * Updates an existing study.
 * Ensures study exists and belongs to the practice before updating.
 * Handles potential subscription limit issues if changing status to ACTIVE.
 * @param studyId - ID of the study to update.
 * @param data - Update data (Validated Zod input body).
 * @param practiceId - ID of the practice (for authorization).
 * @returns The updated study object.
 * @throws AppError if study not found, not authorized, subscription limits exceeded, or DB error.
 */
export const updateStudy = async (
    studyId: string,
    data: Partial<Omit<Prisma.StudyUpdateInput, 'createdBy' | 'practice'> & { status?: StudyStatus }>,
    practiceId: string
) => {
    try {
        // 1. Verify the study exists and belongs to the practice
        const existingStudy = await prisma.study.findFirst({
            where: {
                id: studyId,
                practiceId,
            },
            select: { status: true }, // Select only the current status for checks
        });

        if (!existingStudy) {
            throw new AppError('Study not found or you do not have permission to update it', 404);
        }

        // 2. Check subscription limits IF the status is being changed to ACTIVE
        if (data.status === StudyStatus.ACTIVE && existingStudy.status !== StudyStatus.ACTIVE) {
            const activeStudiesCount = await prisma.study.count({
                where: {
                    practiceId,
                    status: StudyStatus.ACTIVE,
                },
            });
            // Use the same limit checking logic as in createStudy
            const allowedToActivate = await canCreateStudy(practiceId, activeStudiesCount);
            if (!allowedToActivate) {
                throw new AppError('Cannot activate study. Subscription limit for active studies reached.', 403);
            }
        }

        // 3. Perform the update
        // Ensure fields like createdById and practiceId are not accidentally updated
        const { createdById, practiceId: _, ...updateData } = data;

        const updatedStudy = await prisma.study.update({
            where: {
                id: studyId,
                // Practice ID check here is redundant due to the findFirst above, but can be added for safety
                // practiceId: practiceId,
            },
            data: updateData,
            // Optionally include relations if needed in the response
            // include: { ... }
        });

        return updatedStudy;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle potential Prisma errors, e.g., unique constraint violation if any
            // if (error.code === 'P2002') { ... }
        }
        console.error(`Error updating study ${studyId}:`, error);
        throw new AppError('Could not update study due to an internal error', 500);
    }
};

/**
 * Deletes a study.
 * Ensures study exists and belongs to the practice before deletion.
 * @param studyId - ID of the study to delete.
 * @param practiceId - ID of the practice (for authorization).
 * @returns True if deletion was successful.
 * @throws AppError if study not found, not authorized, or DB error.
 */
export const deleteStudy = async (studyId: string, practiceId: string): Promise<boolean> => {
    try {
        // Use deleteMany with where clause to ensure study belongs to the practice
        // This atomically checks existence and deletes if matched.
        const deleteResult = await prisma.study.deleteMany({
            where: {
                id: studyId,
                practiceId, // Authorization check
            },
        });

        // deleteMany returns a count of deleted records.
        // If count is 0, it means the study wasn't found or didn't belong to the practice.
        if (deleteResult.count === 0) {
            throw new AppError('Study not found or you do not have permission to delete it', 404);
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
                 console.error(`Deletion failed due to related records for study ${studyId}:`, error);
                 // Depending on requirements, maybe try to soft delete or return a specific error
                 throw new AppError('Cannot delete study because it has associated records (e.g., patients, observations). Archive it instead?', 409); // 409 Conflict
            }
        }
        console.error(`Error deleting study ${studyId}:`, error);
        throw new AppError('Could not delete study due to an internal error', 500);
    }
};

// --- Placeholder functions for additional management ---

/**
 * Adds a patient to a specific study.
 * Checks if study and patient exist and belong to the same practice.
 * Checks for existing enrollment.
 * @param studyId - ID of the study.
 * @param patientId - ID of the patient.
 * @param practiceId - ID of the practice (for authorization).
 * @returns The created StudyPatient record.
 * @throws AppError if study/patient not found, not in the same practice, already enrolled, or DB error.
 */
export const addPatientToStudyService = async (studyId: string, patientId: string, practiceId: string) => {
    try {
        // 1. Verify study exists and belongs to the practice
        const study = await prisma.study.findFirst({
            where: { id: studyId, practiceId },
            select: { id: true, status: true }, // Select minimal fields
        });
        if (!study) {
            throw new AppError('Study not found or not associated with this practice', 404);
        }
        // Optional: Add check based on study status (e.g., cannot add patients to COMPLETED study)
        if ([StudyStatus.COMPLETED, StudyStatus.ARCHIVED].includes(study.status)) {
             throw new AppError(`Cannot add patient to a study with status: ${study.status}`, 400);
        }

        // 2. Verify patient exists and belongs to the practice
        const patient = await prisma.patient.findFirst({
            where: { id: patientId, practiceId },
            select: { id: true }, // Select minimal fields
        });
        if (!patient) {
            throw new AppError('Patient not found or not associated with this practice', 404);
        }

        // 3. Check if patient is already enrolled in this study
        const existingEnrollment = await prisma.studyPatient.findUnique({
            where: {
                studyId_patientId: { studyId, patientId },
            },
        });
        if (existingEnrollment) {
            // If already enrolled but inactive, maybe reactivate? Or just throw error?
            // For now, throw error if any enrollment exists.
            throw new AppError('Patient is already enrolled in this study', 409); // 409 Conflict
        }

        // 4. Create the StudyPatient record (enrollment)
        const newEnrollment = await prisma.studyPatient.create({
            data: {
                studyId,
                patientId,
                // Default enrollment date is handled by Prisma schema (@default(now()))
                // Default isActive is true
            },
            // Include related data if needed in response
            include: {
                study: { select: { id: true, title: true } },
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
        console.error(`Error adding patient ${patientId} to study ${studyId}:`, error);
        throw new AppError('Could not add patient to study due to an internal error', 500);
    }
};

/**
 * Removes (or deactivates) a patient's enrollment from a study.
 * Checks if enrollment exists and belongs to the practice (implicitly via studyId/patientId).
 * @param studyId - ID of the study.
 * @param patientId - ID of the patient.
 * @param practiceId - ID of the practice (for authorization check on study/patient).
 * @returns True if removal/deactivation was successful.
 * @throws AppError if enrollment not found, or DB error.
 */
export const removePatientFromStudyService = async (studyId: string, patientId: string, practiceId: string) => {
    try {
        // We need to ensure the requestor has rights via the practiceId,
        // but the delete itself only needs the composite key.
        // First, verify the study belongs to the practice to prevent unauthorized access
        const studyCheck = await prisma.study.count({
            where: { id: studyId, practiceId }
        });
        if (studyCheck === 0) {
             throw new AppError('Study not found or not associated with this practice', 404);
        }
        // Optionally, verify patient also belongs to practice (though study check often suffices)
        // const patientCheck = await prisma.patient.count({ where: { id: patientId, practiceId }});
        // if (patientCheck === 0) { ... }

        // Attempt to delete the StudyPatient record
        // Using deleteMany ensures it only deletes if the combo exists.
        const deleteResult = await prisma.studyPatient.deleteMany({
            where: {
                studyId: studyId,
                patientId: patientId,
                // We don't need practiceId here as the studyId implicitly links to the practice
                // and we already verified the study belongs to the practice.
            },
        });

        // If count is 0, the enrollment didn't exist.
        if (deleteResult.count === 0) {
            throw new AppError('Patient enrollment in this study not found', 404);
        }

        // Instead of hard delete, consider soft delete (setting isActive = false)
        // if historical data needs preservation:
        /*
        const updateResult = await prisma.studyPatient.updateMany({
            where: {
                studyId: studyId,
                patientId: patientId,
                study: { practiceId: practiceId } // Ensure it belongs to practice
            },
            data: { isActive: false, exitDate: new Date() },
        });
        if (updateResult.count === 0) {
            throw new AppError('Patient enrollment not found or not associated with this practice', 404);
        }
        */

        return true; // Removal successful

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle potential errors, e.g., related observations that might prevent deletion
            // if (error.code === 'P2003' || error.code === 'P2014') { ... }
        }
        console.error(`Error removing patient ${patientId} from study ${studyId}:`, error);
        throw new AppError('Could not remove patient from study due to an internal error', 500);
    }
};

/**
 * Assigns a user to a specific study with a given role.
 * Checks if study and user exist and belong to the same practice.
 * Checks for existing assignment.
 * TODO: Add permission checks (e.g., only LEAD_RESEARCHER or PRACTICE_OWNER can assign others).
 * @param studyId - ID of the study.
 * @param userId - ID of the user to assign.
 * @param role - The role to assign the user within the study.
 * @param practiceId - ID of the practice (for authorization).
 * @param assigningUserId - ID of the user performing the assignment (for permission checks).
 * @returns The created StudyAssignment record.
 * @throws AppError if study/user not found, not in practice, already assigned, no permission, or DB error.
 */
export const assignUserToStudyService = async (studyId: string, userId: string, role: StudyRole, practiceId: string, assigningUserId: string) => {
    try {
        // --- Permission Check (Placeholder - IMPLEMENT PROPERLY) ---
        // Example: Fetch assigning user's role in the practice/study
        // const assigner = await prisma.user.findUnique({ where: { id: assigningUserId }, include: { assignedStudies: { where: { studyId: studyId } } } });
        // const assignerPracticeRole = assigner?.role;
        // const assignerStudyRole = assigner?.assignedStudies[0]?.role;
        // if (!assigner || !(assignerPracticeRole === UserRole.PRACTICE_OWNER || assignerStudyRole === StudyRole.LEAD_RESEARCHER)) {
        //     throw new AppError('You do not have permission to assign users to this study', 403);
        // }
        console.log(`Assigning user ${userId} (Role: ${role}) to study ${studyId} by user ${assigningUserId}`); // Placeholder Log
        // --------------------------------------------------------

        // 1. Verify study exists and belongs to the practice
        const study = await prisma.study.findFirst({
            where: { id: studyId, practiceId },
            select: { id: true },
        });
        if (!study) {
            throw new AppError('Study not found or not associated with this practice', 404);
        }

        // 2. Verify user exists and belongs to the practice
        const userToAssign = await prisma.user.findFirst({
            where: { id: userId, practiceId },
            select: { id: true },
        });
        if (!userToAssign) {
            throw new AppError('User to assign not found or not associated with this practice', 404);
        }

        // 3. Check if user is already assigned to this study
        const existingAssignment = await prisma.studyAssignment.findUnique({
            where: {
                studyId_userId: { studyId, userId },
            },
        });
        if (existingAssignment) {
            // If already assigned, update the role instead of throwing an error
            if (existingAssignment.role !== role) {
                const updatedAssignment = await prisma.studyAssignment.update({
                    where: { id: existingAssignment.id },
                    data: { role },
                     include: {
                        study: { select: { id: true, title: true } },
                        user: { select: { id: true, firstName: true, lastName: true, role: true } },
                    }
                });
                return updatedAssignment; // Return the updated assignment
            } else {
                 // If role is the same, just return the existing assignment info
                return existingAssignment;
            }
            // Previous logic: throw new AppError('User is already assigned to this study', 409);
        }

        // 4. Create the StudyAssignment record if not existing
        const newAssignment = await prisma.studyAssignment.create({
            data: {
                studyId,
                userId,
                role,
            },
            include: {
                 study: { select: { id: true, title: true } },
                 user: { select: { id: true, firstName: true, lastName: true, role: true } },
            }
        });

        return newAssignment;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle potential DB errors (e.g., FK constraints if user/study deleted concurrently)
        }
        console.error(`Error assigning user ${userId} to study ${studyId}:`, error);
        throw new AppError('Could not assign user to study due to an internal error', 500);
    }
};

/**
 * Unassigns a user from a specific study.
 * Checks if the assignment exists and belongs to the practice.
 * TODO: Add permission checks (e.g., only LEAD_RESEARCHER/PRACTICE_OWNER can unassign, maybe user can unassign self?).
 * @param studyId - ID of the study.
 * @param userId - ID of the user to unassign.
 * @param practiceId - ID of the practice (for authorization).
 * @param assigningUserId - ID of the user performing the action.
 * @returns True if unassignment was successful.
 * @throws AppError if assignment not found, no permission, or DB error.
 */
export const unassignUserFromStudyService = async (studyId: string, userId: string, practiceId: string, assigningUserId: string) => {
    try {
        // --- Permission Check (Placeholder - IMPLEMENT PROPERLY) ---
        // Example: Allow self-unassignment OR admin/lead unassignment
        // const assigner = await prisma.user.findUnique({ where: { id: assigningUserId }});
        // if (!assigner) throw new AppError('Assigner not found', 403);
        // const isSelf = assigningUserId === userId;
        // const isAdminOrLead = [UserRole.PRACTICE_OWNER /*, StudyRole.LEAD_RESEARCHER */].includes(assigner.role);
        // if (!isSelf && !isAdminOrLead) {
        //      throw new AppError('You do not have permission to unassign this user', 403);
        // }
        console.log(`Unassigning user ${userId} from study ${studyId} by user ${assigningUserId}`); // Placeholder Log
        // --------------------------------------------------------

        // Verify study belongs to the practice first for authorization context
        const studyCheck = await prisma.study.count({
             where: { id: studyId, practiceId }
        });
        if (studyCheck === 0) {
             throw new AppError('Study not found or not associated with this practice', 404);
        }

        // Attempt to delete the StudyAssignment record
        const deleteResult = await prisma.studyAssignment.deleteMany({
            where: {
                studyId: studyId,
                userId: userId,
                // studyId implicitly links to practice, verified above
            },
        });

        // If count is 0, the assignment didn't exist.
        if (deleteResult.count === 0) {
            throw new AppError('User assignment to this study not found', 404);
        }

        return true; // Unassignment successful

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        // Handle potential Prisma errors
        console.error(`Error unassigning user ${userId} from study ${studyId}:`, error);
        throw new AppError('Could not unassign user from study due to an internal error', 500);
    }
}; 