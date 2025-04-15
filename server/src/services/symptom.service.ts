import prisma from '../utils/prisma.client';
import { Prisma, SymptomTemplate, SymptomDataType } from '@prisma/client';
import AppError from '../utils/appError';

// TODO: Add detailed logging
// TODO: Add permission checks (e.g., only certain study roles can manage templates)

/**
 * Checks if a study exists and belongs to the given practice.
 * Throws AppError if not found or not authorized.
 * @param studyId - ID of the study.
 * @param practiceId - ID of the practice.
 */
const checkStudyAccess = async (studyId: string, practiceId: string): Promise<void> => {
    const study = await prisma.study.findFirst({
        where: { id: studyId, practiceId },
        select: { id: true },
    });
    if (!study) {
        throw new AppError('Study not found or you do not have access to it', 404);
    }
};

/**
 * Creates a new symptom template associated with a Monitoring Plan.
 * @param monitoringPlanId - ID of the Monitoring Plan.
 * @param data - Symptom template data (Validated Zod input body).
 * @param practiceId - ID of the practice (for authorization).
 * @returns The created SymptomTemplate.
 * @throws AppError if validation fails or DB error.
 */
export const createSymptomTemplate = async (
    monitoringPlanId: string,
    data: Omit<Prisma.SymptomTemplateCreateInput, 'monitoringPlan' | 'monitoringPlanId'>,
    practiceId: string
): Promise<SymptomTemplate> => {
    try {
        // Verify the monitoring plan exists and belongs to the practice
        const planCheck = await prisma.monitoringPlan.count({
            where: { id: monitoringPlanId, practiceId }
        });
        if (planCheck === 0) {
            throw new AppError('Monitoring Plan not found or not associated with this practice', 404);
        }

        // Prepare data for Prisma create
        const createData: Prisma.SymptomTemplateCreateInput = {
            ...data,
            monitoringPlan: { connect: { id: monitoringPlanId } },
        };

        const symptomTemplate = await prisma.symptomTemplate.create({ data: createData });
        return symptomTemplate;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error('Error creating symptom template:', error);
        throw new AppError('Could not create symptom template due to an internal error', 500);
    }
};

/**
 * Finds all symptom templates for a specific Monitoring Plan.
 * @param monitoringPlanId - ID of the Monitoring Plan.
 * @param practiceId - ID of the practice (for authorization).
 * @returns Array of SymptomTemplates.
 * @throws AppError if validation fails or DB error.
 */
export const findSymptomTemplatesByMonitoringPlan = async (monitoringPlanId: string, practiceId: string): Promise<SymptomTemplate[]> => {
    try {
        // Verify the monitoring plan exists and belongs to the practice
        const planCheck = await prisma.monitoringPlan.count({
            where: { id: monitoringPlanId, practiceId }
        });
        if (planCheck === 0) {
            throw new AppError('Monitoring Plan not found or not associated with this practice', 404);
        }

        const symptomTemplates = await prisma.symptomTemplate.findMany({
            where: { monitoringPlanId },
            orderBy: { name: 'asc' },
        });
        return symptomTemplates;
    } catch (error) {
        console.error('Error finding symptom templates:', error);
        throw new AppError('Could not retrieve symptom templates due to an internal error', 500);
    }
};

/**
 * Finds a specific symptom template by its ID.
 * @param monitoringPlanId - ID of the Monitoring Plan (optional, for context/auth).
 * @param symptomTemplateId - ID of the Symptom Template.
 * @param practiceId - ID of the practice (for authorization).
 * @returns The SymptomTemplate or null if not found.
 * @throws AppError if validation fails or DB error.
 */
export const findSymptomTemplateById = async (monitoringPlanId: string | undefined, symptomTemplateId: string, practiceId: string): Promise<SymptomTemplate | null> => {
    try {
        const where: Prisma.SymptomTemplateWhereInput = {
            id: symptomTemplateId,
            monitoringPlan: { practiceId } // Ensure it belongs to the correct practice
        };

        // If monitoringPlanId is provided, ensure it matches
        if (monitoringPlanId) {
            where.monitoringPlanId = monitoringPlanId;
        }

        const symptomTemplate = await prisma.symptomTemplate.findFirst({ where });
        return symptomTemplate;
    } catch (error) {
        console.error('Error finding symptom template by ID:', error);
        throw new AppError('Could not retrieve symptom template due to an internal error', 500);
    }
};

/**
 * Updates an existing symptom template.
 * @param symptomTemplateId - ID of the Symptom Template to update.
 * @param data - Update data (Validated Zod input body).
 * @param practiceId - ID of the practice (for authorization).
 * @returns The updated SymptomTemplate.
 * @throws AppError if validation fails, template not found, or DB error.
 */
export const updateSymptomTemplate = async (
    symptomTemplateId: string,
    data: Partial<Omit<Prisma.SymptomTemplateUpdateInput, 'monitoringPlan'>>,
    practiceId: string
): Promise<SymptomTemplate> => {
    try {
        // Verify the template exists and belongs to the practice
        const existingTemplate = await prisma.symptomTemplate.findFirst({
            where: {
                id: symptomTemplateId,
                monitoringPlan: { practiceId }
            }
        });

        if (!existingTemplate) {
            throw new AppError('Symptom template not found or you do not have permission to update it', 404);
        }

        // Perform the update
        const updatedSymptomTemplate = await prisma.symptomTemplate.update({
            where: { id: symptomTemplateId },
            data,
        });
        return updatedSymptomTemplate;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error('Error updating symptom template:', error);
        throw new AppError('Could not update symptom template due to an internal error', 500);
    }
};

/**
 * Deletes a symptom template.
 * @param symptomTemplateId - ID of the Symptom Template to delete.
 * @param practiceId - ID of the practice (for authorization).
 * @returns True if deletion was successful.
 * @throws AppError if validation fails, template not found, or DB error.
 */
export const deleteSymptomTemplate = async (symptomTemplateId: string, practiceId: string): Promise<boolean> => {
    try {
        // Verify the template exists and belongs to the practice
        const templateCheck = await prisma.symptomTemplate.count({
            where: {
                id: symptomTemplateId,
                monitoringPlan: { practiceId }
            }
        });

        if (templateCheck === 0) {
            throw new AppError('Symptom template not found or you do not have permission to delete it', 404);
        }

        // Perform the delete
        await prisma.symptomTemplate.delete({
            where: { id: symptomTemplateId },
        });
        return true;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2014') {
            // Handle case where observations exist and deletion is restricted
            throw new AppError('Cannot delete symptom template with associated observations', 400);
        }
        if (error instanceof AppError) {
            throw error;
        }
        console.error('Error deleting symptom template:', error);
        throw new AppError('Could not delete symptom template due to an internal error', 500);
    }
}; 