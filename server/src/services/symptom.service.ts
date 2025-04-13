import prisma from '../utils/prisma.client';
import { Prisma, SymptomTemplate, SymptomDataType } from '../generated/prisma';
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
 * Creates a new SymptomTemplate for a specific study.
 * @param studyId - ID of the study to associate the template with.
 * @param data - SymptomTemplate creation data (Validated Zod input body).
 * @param practiceId - ID of the practice (for authorization check on study).
 * @returns The created SymptomTemplate.
 * @throws AppError if study access check fails or DB error.
 */
export const createSymptomTemplate = async (
    studyId: string,
    data: Omit<Prisma.SymptomTemplateCreateInput, 'study' | 'studyId'>,
    practiceId: string
): Promise<SymptomTemplate> => {
    await checkStudyAccess(studyId, practiceId); // Authorize access to study first

    try {
        // Prepare the data for Prisma, ensuring type compatibility
        const createData: Prisma.SymptomTemplateCreateInput = {
            ...data, // Spread the validated input data (name, dataType, etc.)
            study: { connect: { id: studyId } }, // Connect to the study
        };

        const symptomTemplate = await prisma.symptomTemplate.create({ data: createData });
        return symptomTemplate;
    } catch (error) {
        console.error(`Error creating symptom template for study ${studyId}:`, error);
        throw new AppError('Could not create symptom template due to an internal error', 500);
    }
};

/**
 * Retrieves all SymptomTemplates associated with a specific study.
 * @param studyId - ID of the study.
 * @param practiceId - ID of the practice (for authorization check on study).
 * @returns An array of SymptomTemplates.
 * @throws AppError if study access check fails or DB error.
 */
export const findSymptomTemplatesByStudy = async (studyId: string, practiceId: string): Promise<SymptomTemplate[]> => {
    await checkStudyAccess(studyId, practiceId);

    try {
        const templates = await prisma.symptomTemplate.findMany({
            where: { studyId },
            orderBy: {
                // Optional: order by name or creation date
                name: 'asc',
            },
        });
        return templates;
    } catch (error) {
        console.error(`Error retrieving symptom templates for study ${studyId}:`, error);
        throw new AppError('Could not retrieve symptom templates due to an internal error', 500);
    }
};

/**
 * Retrieves a specific SymptomTemplate by its ID, ensuring it belongs to the correct study.
 * @param studyId - ID of the study.
 * @param symptomId - ID of the symptom template.
 * @param practiceId - ID of the practice (for authorization check on study).
 * @returns The SymptomTemplate or null if not found.
 * @throws AppError if study access check fails initially.
 */
export const findSymptomTemplateById = async (
    studyId: string,
    symptomId: string,
    practiceId: string
): Promise<SymptomTemplate | null> => {
    await checkStudyAccess(studyId, practiceId);

    try {
        const template = await prisma.symptomTemplate.findFirst({
            where: {
                id: symptomId,
                studyId: studyId, // Ensure it belongs to the specified study
            },
        });
        return template;
    } catch (error) {
        console.error(`Error finding symptom template ${symptomId} for study ${studyId}:`, error);
        throw new AppError('Could not retrieve symptom template due to an internal error', 500);
    }
};

/**
 * Updates an existing SymptomTemplate.
 * @param studyId - ID of the study.
 * @param symptomId - ID of the symptom template to update.
 * @param data - Update data (Validated Zod input body).
 * @param practiceId - ID of the practice (for authorization check on study).
 * @returns The updated SymptomTemplate.
 * @throws AppError if study access fails, template not found, or DB error.
 */
export const updateSymptomTemplate = async (
    studyId: string,
    symptomId: string,
    data: Partial<Omit<Prisma.SymptomTemplateUpdateInput, 'study'> >,
    practiceId: string
): Promise<SymptomTemplate> => {
    await checkStudyAccess(studyId, practiceId);

    try {
        // Use updateMany to ensure the template exists and belongs to the study atomically
        // Alternatively, find first then update, but updateMany is safer against race conditions
        const updateResult = await prisma.symptomTemplate.updateMany({
            where: {
                id: symptomId,
                studyId: studyId,
            },
            data: data,
        });

        if (updateResult.count === 0) {
            throw new AppError('Symptom template not found within this study', 404);
        }

        // Fetch the updated template to return it
        const updatedTemplate = await findSymptomTemplateById(studyId, symptomId, practiceId);
        if (!updatedTemplate) {
             // Should not happen if updateResult.count > 0, but belts and suspenders
            throw new AppError('Failed to retrieve updated symptom template', 500);
        }
        return updatedTemplate;

    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error(`Error updating symptom template ${symptomId} for study ${studyId}:`, error);
        throw new AppError('Could not update symptom template due to an internal error', 500);
    }
};

/**
 * Deletes a SymptomTemplate.
 * @param studyId - ID of the study.
 * @param symptomId - ID of the symptom template to delete.
 * @param practiceId - ID of the practice (for authorization check on study).
 * @returns True if deletion was successful.
 * @throws AppError if study access fails, template not found, associated observations exist, or DB error.
 */
export const deleteSymptomTemplate = async (studyId: string, symptomId: string, practiceId: string): Promise<boolean> => {
    await checkStudyAccess(studyId, practiceId);

    try {
        // Use deleteMany to ensure atomic check and delete
        const deleteResult = await prisma.symptomTemplate.deleteMany({
            where: {
                id: symptomId,
                studyId: studyId,
            },
        });

        if (deleteResult.count === 0) {
            throw new AppError('Symptom template not found within this study', 404);
        }

        return true;

    } catch (error) {
        if (error instanceof AppError) throw error;
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Check for foreign key constraint violation (P2003/P2014)
            // This means there are Observations linked to this template
            if (error.code === 'P2003' || error.code === 'P2014') {
                 throw new AppError('Cannot delete symptom template because it has associated observations', 409); // 409 Conflict
            }
        }
        console.error(`Error deleting symptom template ${symptomId} for study ${studyId}:`, error);
        throw new AppError('Could not delete symptom template due to an internal error', 500);
    }
}; 