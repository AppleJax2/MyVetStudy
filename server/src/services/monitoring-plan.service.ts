import { Prisma, MonitoringPlanStatus, MonitoringPlanRole, SubscriptionTier } from '@prisma/client';
import AppError from '../utils/appError'; // Assuming AppError might still be needed or refactored later
import { findPracticeById } from './practice.service'; // Assuming this is still needed or refactored
import { Injectable, NotFoundException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindAllParams } from '../utils/findAll.params'; // Assuming this exists and is correct
import { MonitoringPlan } from '@prisma/client'; // Explicitly import the MonitoringPlan model type

@Injectable()
export class MonitoringPlanService {
    constructor(private prisma: PrismaService) { }

    /**
     * Checks if a practice can create another monitoring plan based on its subscription tier.
     * @param practiceId - ID of the practice.
     * @param currentActiveMonitoringPlans - Number of currently active monitoring plans.
     * @returns True if the practice can create a new monitoring plan, false otherwise.
     * @throws NotFoundException if practice not found.
     */
    private async canCreateMonitoringPlan(practiceId: string, currentActiveMonitoringPlans: number): Promise<boolean> {
        // Assuming findPracticeById needs to be adapted or injected if it's another service
        // For now, using a placeholder or assuming it's available in scope.
        // In a real NestJS app, PracticeService would be injected.
        // const practice = await this.practiceService.findOne(practiceId); // Example injection
        const practice = await findPracticeById(practiceId); // Using the imported function temporarily

        if (!practice) {
            throw new NotFoundException(`Practice with ID ${practiceId} not found.`);
        }

        if (practice.subscriptionStatus !== 'ACTIVE' && practice.subscriptionStatus !== 'TRIAL') {
            return false;
        }

        switch (practice.subscriptionTier) {
            case SubscriptionTier.BASIC:
                return currentActiveMonitoringPlans < 5;
            case SubscriptionTier.STANDARD:
                return currentActiveMonitoringPlans < 20;
            case SubscriptionTier.PREMIUM:
            case SubscriptionTier.TRIAL:
                return true;
            default:
                return false;
        }
    }

    /**
     * Creates a new monitoring plan, checking subscription limits.
     * Requires practiceId and userId to be part of the input data or handled upstream (e.g., from auth).
     * @param data - MonitoringPlan creation data including createdById and practiceId.
     * @returns The created monitoring plan.
     * @throws ForbiddenException if subscription limits exceeded.
     * @throws InternalServerErrorException for database errors.
     */
    async create(data: Prisma.MonitoringPlanCreateInput): Promise<MonitoringPlan> {
        // Extract necessary IDs - assuming they are passed in the data object now
        const { practiceId, createdById } = data;
        if (!practiceId || !createdById) {
            throw new InternalServerErrorException('practiceId and createdById must be provided in the creation data.');
        }

        try {
            const activeMonitoringPlansCount = await this.prisma.monitoringPlan.count({
                where: {
                    practiceId,
                    status: MonitoringPlanStatus.ACTIVE,
                },
            });

            const allowedToCreate = await this.canCreateMonitoringPlan(practiceId, activeMonitoringPlansCount);
            if (!allowedToCreate && (data.status === MonitoringPlanStatus.ACTIVE)) {
                throw new ForbiddenException('Subscription limit for active monitoring plans reached. Upgrade required.');
            }

            // Ensure default status if not provided
            const createData: Prisma.MonitoringPlanCreateInput = {
                ...data,
                status: data.status ?? MonitoringPlanStatus.DRAFT,
                // Connections are handled by Prisma based on ID fields in data
            };

            return await this.prisma.monitoringPlan.create({ data: createData });
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            console.error('Error creating monitoring plan:', error);
            throw new InternalServerErrorException('Could not create monitoring plan due to an internal error.');
        }
    }

    /**
     * Finds monitoring plans with filtering and pagination.
     * @param params - Includes standard FindAllParams and practiceId.
     * @returns A list of monitoring plans.
     */
    async findAll(params: FindAllParams & { practiceId?: string; status?: MonitoringPlanStatus; search?: string }): Promise<{ monitoringPlans: MonitoringPlan[], pagination: { total: number, page: number, limit: number, totalPages: number } }> {
        const { skip = 0, take = 10, cursor, orderBy = { updatedAt: 'desc' }, practiceId, status, search } = params;
        const page = Math.floor(skip / take) + 1;

        const where: Prisma.MonitoringPlanWhereInput = {
             ...(practiceId && { practiceId }), // Conditionally add practiceId
             ...(status && { status }), // Conditionally add status
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        try {
            const [monitoringPlans, totalMonitoringPlans] = await this.prisma.$transaction([
                this.prisma.monitoringPlan.findMany({
                    where,
                    skip,
                    take,
                    cursor,
                    orderBy,
                    // Include relations if needed, similar to the original findMonitoringPlanById
                    include: {
                        createdBy: { select: { id: true, firstName: true, lastName: true } },
                         patients: {
                            include: { patient: { select: { id: true, name: true, species: true, breed: true } } },
                            where: { isActive: true },
                         },
                         assignedUsers: {
                            include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
                         },
                         // Include other relations as needed for list view
                         _count: { select: { patients: true, assignedUsers: true } } // Example count
                    }
                }),
                this.prisma.monitoringPlan.count({ where })
            ]);

            return {
                 monitoringPlans,
                 pagination: {
                     total: totalMonitoringPlans,
                     page,
                     limit: take,
                     totalPages: Math.ceil(totalMonitoringPlans / take),
                 },
             };
        } catch (error) {
            console.error('Error finding monitoring plans:', error);
            throw new InternalServerErrorException('Could not retrieve monitoring plans due to an internal error.');
        }
    }


    /**
     * Finds a single monitoring plan by its unique identifier.
     * Includes detailed relations.
     * @param where - Unique identifier (e.g., { id: monitoringPlanId }).
     * @param practiceId - Optional practice ID for authorization.
     * @returns The monitoring plan or null if not found/authorized.
     */
    async findOne(
        where: Prisma.MonitoringPlanWhereUniqueInput,
        practiceId?: string // Add practiceId for auth check
    ): Promise<MonitoringPlan | null> {
         try {
             // Add practiceId to the where clause if provided
             const effectiveWhere = practiceId ? { ...where, practiceId } : where;

             return await this.prisma.monitoringPlan.findUnique({
                 where: effectiveWhere,
                 include: {
                     createdBy: { select: { id: true, firstName: true, lastName: true } },
                     patients: {
                         include: { patient: { select: { id: true, name: true, species: true, breed: true } } },
                         where: { isActive: true },
                     },
                     assignedUsers: {
                         include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
                     },
                     symptomTemplates: true,
                     treatmentTemplates: true,
                     notes: { orderBy: { createdAt: 'desc' } },
                 }
             });
         } catch (error) {
            console.error(`Error finding monitoring plan by ID ${where.id}:`, error);
            throw new InternalServerErrorException('Could not retrieve monitoring plan details due to an internal error.');
        }
    }

    /**
     * Finds a single monitoring plan by its unique identifier or throws an error.
     * @param where - Unique identifier.
     * @param practiceId - Optional practice ID for authorization.
     * @returns The monitoring plan.
     * @throws NotFoundException if not found or not authorized.
     */
    async findOneOrThrow(
        where: Prisma.MonitoringPlanWhereUniqueInput,
        practiceId?: string // Add practiceId for auth check
    ): Promise<MonitoringPlan> {
        const monitoringPlan = await this.findOne(where, practiceId);
        if (!monitoringPlan) {
            throw new NotFoundException(`Monitoring plan not found or access denied.`);
        }
        return monitoringPlan;
    }

    /**
     * Updates an existing monitoring plan.
     * Requires practiceId for authorization check.
     * @param where - Unique identifier for the monitoring plan.
     * @param data - Update data.
     * @param practiceId - ID of the practice for authorization.
     * @returns The updated monitoring plan.
     * @throws NotFoundException if not found/authorized.
     * @throws ForbiddenException if activation violates subscription limits.
     * @throws InternalServerErrorException on database errors.
     */
    async update(
        where: Prisma.MonitoringPlanWhereUniqueInput,
        data: Prisma.MonitoringPlanUpdateInput,
        practiceId: string // Require practiceId for authorization
    ): Promise<MonitoringPlan> {
        try {
            // 1. Verify the monitoring plan exists and belongs to the practice
            const existingMonitoringPlan = await this.prisma.monitoringPlan.findFirst({
                where: { ...where, practiceId },
                select: { status: true },
            });

            if (!existingMonitoringPlan) {
                throw new NotFoundException('Monitoring Plan not found or you do not have permission to update it.');
            }

            // 2. Check subscription limits IF the status is being changed to ACTIVE
            const newStatus = data.status as MonitoringPlanStatus | undefined; // Type assertion
            if (newStatus === MonitoringPlanStatus.ACTIVE && existingMonitoringPlan.status !== MonitoringPlanStatus.ACTIVE) {
                const activeMonitoringPlansCount = await this.prisma.monitoringPlan.count({
                    where: { practiceId, status: MonitoringPlanStatus.ACTIVE },
                });
                const allowedToActivate = await this.canCreateMonitoringPlan(practiceId, activeMonitoringPlansCount);
                if (!allowedToActivate) {
                    throw new ForbiddenException('Cannot activate monitoring plan. Subscription limit reached.');
                }
            }

            // 3. Perform the update, ensuring practiceId check
            return await this.prisma.monitoringPlan.update({
                where: { ...where, practiceId }, // Ensure update is scoped to practice
                data,
            });

        } catch (error) {
             if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            console.error(`Error updating monitoring plan ${where.id}:`, error);
            throw new InternalServerErrorException('Could not update monitoring plan due to an internal error.');
        }
    }

    /**
     * Deletes a monitoring plan. Requires practiceId for authorization.
     * @param where - Unique identifier for the monitoring plan.
     * @param practiceId - ID of the practice for authorization.
     * @returns The deleted monitoring plan object (Prisma returns this).
     * @throws NotFoundException if not found/authorized.
     * @throws ConflictException if deletion fails due to constraints.
     * @throws InternalServerErrorException on other database errors.
     */
    async remove(
        where: Prisma.MonitoringPlanWhereUniqueInput,
        practiceId: string // Require practiceId for authorization
    ): Promise<MonitoringPlan> {
        // Ensure the monitoring plan exists and belongs to the practice first
        await this.findOneOrThrow(where, practiceId);

        try {
            // Perform deletion scoped by practice ID
            return await this.prisma.monitoringPlan.delete({ where: { ...where, practiceId } });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003' || error.code === 'P2014') {
                    console.error(`Deletion failed due to related records for monitoring plan ${where.id}:`, error);
                    throw new ConflictException('Cannot delete monitoring plan because it has associated records.');
                }
            }
             if (error instanceof NotFoundException) { // Should be caught by findOneOrThrow, but belt-and-suspenders
                throw error;
            }
            console.error(`Error deleting monitoring plan ${where.id}:`, error);
            throw new InternalServerErrorException('Could not delete monitoring plan due to an internal error.');
        }
    }


    // --- Additional Management Functions (Refactored for NestJS Service) ---

    /**
     * Adds a patient to a specific monitoring plan.
     * Assumes practiceId is verified upstream (e.g., via controller decorator/guard).
     * @param monitoringPlanId - ID of the monitoring plan.
     * @param patientId - ID of the patient.
     * @param practiceId - ID of the practice (for authorization).
     * @returns The created MonitoringPlanPatient record.
     * @throws NotFoundException if monitoring plan/patient not found in practice.
     * @throws ConflictException if patient already enrolled.
     * @throws InternalServerErrorException on database errors.
     */
    async addPatientToMonitoringPlan(monitoringPlanId: string, patientId: string, practiceId: string): Promise<Prisma.MonitoringPlanPatientGetPayload<{ include: { monitoringPlan: { select: { id: true, title: true } }, patient: { select: { id: true, name: true } } } }>> {
        try {
            // 1. Verify monitoring plan exists and belongs to the practice
            const monitoringPlan = await this.prisma.monitoringPlan.findFirst({
                where: { id: monitoringPlanId, practiceId },
                select: { id: true, status: true },
            });
            if (!monitoringPlan) {
                throw new NotFoundException('Monitoring Plan not found or not associated with this practice.');
            }
            if ([MonitoringPlanStatus.COMPLETED, MonitoringPlanStatus.ARCHIVED].includes(monitoringPlan.status)) {
                 throw new ConflictException(`Cannot add patient to a monitoring plan with status: ${monitoringPlan.status}.`);
            }

            // 2. Verify patient exists and belongs to the practice
            const patient = await this.prisma.patient.findFirst({
                where: { id: patientId, practiceId },
                select: { id: true },
            });
            if (!patient) {
                throw new NotFoundException('Patient not found or not associated with this practice.');
            }

            // 3. Check for existing enrollment (handled by upsert or unique constraint)
            // Use create to avoid accidental updates if upsert isn't desired. Throw on unique constraint violation (P2002).

            // 4. Create the MonitoringPlanPatient record (enrollment)
            return await this.prisma.monitoringPlanPatient.create({
                data: {
                    monitoringPlanId,
                    patientId,
                    // isActive defaults to true via schema
                },
                include: {
                    monitoringPlan: { select: { id: true, title: true } },
                    patient: { select: { id: true, name: true } },
                }
            });

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                 throw new ConflictException('Patient is already enrolled in this monitoring plan.');
            }
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            console.error(`Error adding patient ${patientId} to monitoring plan ${monitoringPlanId}:`, error);
            throw new InternalServerErrorException('Could not add patient to monitoring plan due to an internal error.');
        }
    }

    /**
     * Removes a patient's enrollment from a monitoring plan.
     * @param monitoringPlanId - ID of the monitoring plan.
     * @param patientId - ID of the patient.
     * @param practiceId - ID of the practice (for authorization).
     * @returns The deleted MonitoringPlanPatient record.
     * @throws NotFoundException if enrollment/monitoring plan not found in practice.
     * @throws ConflictException if deletion fails due to constraints.
     * @throws InternalServerErrorException on other database errors.
     */
    async removePatientFromMonitoringPlan(monitoringPlanId: string, patientId: string, practiceId: string): Promise<Prisma.MonitoringPlanPatientGetPayload<{}>> {
        try {
            // 1. Verify the monitoring plan belongs to the practice (authorization check)
            const monitoringPlan = await this.prisma.monitoringPlan.findFirst({
                where: { id: monitoringPlanId, practiceId }, select: { id: true }
            });
            if (!monitoringPlan) {
                throw new NotFoundException('Monitoring Plan not found or not associated with this practice.');
            }

            // 2. Attempt deletion using the composite key, implicitly checking enrollment existence
            return await this.prisma.monitoringPlanPatient.delete({
                where: {
                    monitoringPlanId_patientId: { monitoringPlanId, patientId },
                },
            });

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') { // Record to delete not found
                     throw new NotFoundException('Patient enrollment not found in this monitoring plan.');
                }
                if (error.code === 'P2003' || error.code === 'P2014') { // Foreign key constraint
                     console.error(`Deletion failed due to related records for patient ${patientId} in plan ${monitoringPlanId}:`, error);
                     throw new ConflictException('Cannot remove patient due to associated records (e.g., observations).');
                }
            }
            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            console.error(`Error removing patient ${patientId} from plan ${monitoringPlanId}:`, error);
            throw new InternalServerErrorException('Could not remove patient from monitoring plan.');
        }
    }

     /**
     * Assigns a user to a monitoring plan with a specific role.
     * @param monitoringPlanId - ID of the monitoring plan.
     * @param userId - ID of the user being assigned.
     * @param role - Role to assign.
     * @param practiceId - ID of the practice (for authorization).
     * @returns The created or updated assignment record.
     * @throws NotFoundException if monitoring plan/user not found in practice.
     * @throws InternalServerErrorException on database errors.
     */
    async assignUserToMonitoringPlan(monitoringPlanId: string, userId: string, role: MonitoringPlanRole, practiceId: string): Promise<Prisma.MonitoringPlanAssignmentGetPayload<{ include: { user: { select: { id: true, firstName: true, lastName: true, role: true } }, monitoringPlan: { select: { id: true, title: true } } } }>> {
        try {
            // 1. Verify monitoring plan exists and belongs to the practice
            const monitoringPlan = await this.prisma.monitoringPlan.findFirst({
                where: { id: monitoringPlanId, practiceId }, select: { id: true }
            });
            if (!monitoringPlan) {
                throw new NotFoundException('Monitoring Plan not found or not associated with this practice.');
            }

            // 2. Verify user exists and belongs to the practice
            const user = await this.prisma.user.findFirst({
                where: { id: userId, practiceId }, select: { id: true }
            });
            if (!user) {
                throw new NotFoundException('User not found or not associated with this practice.');
            }

            // 3. Create or update the assignment using upsert
            return await this.prisma.monitoringPlanAssignment.upsert({
                where: {
                    monitoringPlanId_userId: { monitoringPlanId, userId },
                },
                update: { role },
                create: { monitoringPlanId, userId, role },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, role: true } },
                    monitoringPlan: { select: { id: true, title: true } },
                },
            });

        } catch (error) {
             if (error instanceof NotFoundException) {
                throw error;
            }
            console.error(`Error assigning user ${userId} to plan ${monitoringPlanId}:`, error);
            throw new InternalServerErrorException('Could not assign user to monitoring plan.');
        }
    }


    /**
     * Unassigns a user from a monitoring plan.
     * @param monitoringPlanId - ID of the monitoring plan.
     * @param userId - ID of the user being unassigned.
     * @param practiceId - ID of the practice (for authorization).
     * @returns The deleted assignment record.
     * @throws NotFoundException if assignment/monitoring plan not found in practice.
     * @throws InternalServerErrorException on database errors.
     */
    async unassignUserFromMonitoringPlan(monitoringPlanId: string, userId: string, practiceId: string): Promise<Prisma.MonitoringPlanAssignmentGetPayload<{}>> {
         try {
            // 1. Verify the monitoring plan belongs to the practice
            const monitoringPlan = await this.prisma.monitoringPlan.findFirst({
                where: { id: monitoringPlanId, practiceId }, select: { id: true }
            });
            if (!monitoringPlan) {
                throw new NotFoundException('Monitoring Plan not found or not associated with this practice.');
            }

            // 2. Attempt deletion using the composite key
            return await this.prisma.monitoringPlanAssignment.delete({
                where: {
                    monitoringPlanId_userId: { monitoringPlanId, userId },
                },
            });

        } catch (error) {
             if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                 throw new NotFoundException('User assignment not found for this monitoring plan.');
             }
             if (error instanceof NotFoundException) {
                 throw error;
            }
            console.error(`Error unassigning user ${userId} from plan ${monitoringPlanId}:`, error);
            throw new InternalServerErrorException('Could not unassign user from monitoring plan.');
        }
    }

} 