import prisma from '../utils/prisma.client';
import { Prisma, Observation, SymptomDataType } from '../generated/prisma';
import AppError from '../utils/appError';
import { findSymptomTemplateById } from './symptom.service'; // For validating value against template

// TODO: Add detailed logging
// TODO: Add permission checks (e.g., user role within study allows observation recording?)

/**
 * Validates the observation value against the data type defined in the SymptomTemplate.
 * @param value - The value to validate.
 * @param dataType - The expected data type from the SymptomTemplate.
 * @param options - Optional constraints from the template (e.g., min/max, enum options).
 * @returns True if valid, otherwise throws AppError.
 */
const validateObservationValue = (
    value: any,
    dataType: SymptomDataType,
    options?: { minValue?: number | null; maxValue?: number | null; options?: any | null }
): boolean => {
    switch (dataType) {
        case SymptomDataType.NUMERIC:
            if (typeof value !== 'number') {
                throw new AppError('Invalid value: Expected a number', 400);
            }
            if (options?.minValue !== null && options?.minValue !== undefined && value < options.minValue) {
                throw new AppError(`Invalid value: Must be at least ${options.minValue}`, 400);
            }
            if (options?.maxValue !== null && options?.maxValue !== undefined && value > options.maxValue) {
                throw new AppError(`Invalid value: Must be at most ${options.maxValue}`, 400);
            }
            break;
        case SymptomDataType.BOOLEAN:
            if (typeof value !== 'boolean') {
                throw new AppError('Invalid value: Expected true or false', 400);
            }
            break;
        case SymptomDataType.SCALE: // Assuming scale is numeric, potentially with min/max
             if (typeof value !== 'number') {
                throw new AppError('Invalid value: Expected a number for scale', 400);
            }
             if (options?.minValue !== null && options?.minValue !== undefined && value < options.minValue) {
                throw new AppError(`Invalid value: Scale must be at least ${options.minValue}`, 400);
            }
            if (options?.maxValue !== null && options?.maxValue !== undefined && value > options.maxValue) {
                throw new AppError(`Invalid value: Scale must be at most ${options.maxValue}`, 400);
            }
            break;
        case SymptomDataType.ENUMERATION:
            // Assuming options.options is an array of allowed strings, adjust if different
            if (!options?.options || !Array.isArray(options.options) || !options.options.includes(value)) {
                throw new AppError(`Invalid value: Must be one of [${(options?.options as any[] || []).join(', ')}]`, 400);
            }
            break;
        case SymptomDataType.TEXT:
            if (typeof value !== 'string') {
                throw new AppError('Invalid value: Expected text', 400);
            }
            // Add length limits if needed
            break;
        case SymptomDataType.IMAGE: // Placeholder - Validation might involve checking if value is a valid file ID/URL
            if (typeof value !== 'string' || !value) { // Basic check for non-empty string
                 throw new AppError('Invalid value: Expected image identifier/URL', 400);
            }
            // Add more specific validation if needed (e.g., regex for URL format)
            break;
        default:
            throw new AppError(`Unsupported data type for validation: ${dataType}`, 500);
    }
    return true;
};


/**
 * Creates a new Observation for a patient within a study.
 * @param studyId - ID of the study.
 * @param data - Observation creation data (Validated Zod input body, excluding derived fields).
 * @param userId - ID of the user recording the observation.
 * @param practiceId - ID of the practice (for authorization checks).
 * @returns The created Observation.
 * @throws AppError if validation fails, related records not found, or DB error.
 */
export const createObservation = async (
    studyId: string,
    data: Omit<Prisma.ObservationCreateInput, 'recordedBy' | 'studyPatient' | 'symptomTemplate'>,
    userId: string,
    practiceId: string
): Promise<Observation> => {
    try {
        // 1. Fetch the SymptomTemplate to validate value and ensure it belongs to the study/practice
        const symptomTemplate = await findSymptomTemplateById(studyId, data.symptomTemplateId, practiceId);
        if (!symptomTemplate) {
            throw new AppError('Symptom template not found or not associated with this study', 404);
        }

        // 2. Validate the provided value against the template's data type
        validateObservationValue(data.value, symptomTemplate.dataType, {
            minValue: symptomTemplate.minValue,
            maxValue: symptomTemplate.maxValue,
            options: symptomTemplate.options, // Assuming options stored correctly for ENUM
        });

        // 3. Find the specific StudyPatient record for this patient in this study
        const studyPatient = await prisma.studyPatient.findUnique({
            where: {
                studyId_patientId: { studyId, patientId: data.patientId },
                isActive: true, // Ensure the patient is actively enrolled
                // Verify patient belongs to the practice indirectly via study
                study: { practiceId: practiceId }
            },
            select: { id: true },
        });
        if (!studyPatient) {
            throw new AppError('Patient is not actively enrolled in this study within your practice', 404);
        }

        // 4. Create the Observation record
        const observationData: Prisma.ObservationCreateInput = {
            value: data.value,
            notes: data.notes,
            symptomTemplate: { connect: { id: data.symptomTemplateId } },
            patient: { connect: { id: data.patientId } },
            studyPatient: { connect: { id: studyPatient.id } },
            recordedBy: { connect: { id: userId } },
            // recordedAt is handled by Prisma default
            // files: data.files ? { connect: data.files.map(id => ({ id })) } : undefined,
        };

        const newObservation = await prisma.observation.create({ data: observationData });

        // TODO: Trigger alert checks based on AlertThresholds associated with the SymptomTemplate

        return newObservation;

    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error(`Error creating observation for study ${studyId}, patient ${data.patientId}:`, error);
        throw new AppError('Could not create observation due to an internal error', 500);
    }
};

/**
 * Retrieves observations based on specified criteria (e.g., for a specific patient in a study).
 * @param criteria - Filtering and pagination options.
 * @param practiceId - ID of the practice for authorization.
 * @returns List of observations and pagination metadata.
 * @throws AppError on DB errors or if required criteria missing.
 */
export const findObservations = async (
    criteria: { studyId?: string; patientId?: string; symptomTemplateId?: string; startDate?: Date; endDate?: Date; limit?: number; page?: number },
    practiceId: string
) => {
    const { studyId, patientId, symptomTemplateId, startDate, endDate, limit = 25, page = 1 } = criteria;
    const skip = (page - 1) * limit;

    // Authorization: Ensure at least studyId or patientId is provided and belongs to the practice
    // This is crucial to prevent unauthorized data access.
    if (!studyId && !patientId) {
        throw new AppError('Must provide at least Study ID or Patient ID to query observations', 400);
    }

    const where: Prisma.ObservationWhereInput = {};

    if (studyId) {
        where.studyPatient = { study: { id: studyId, practiceId } };
    }
    if (patientId) {
        // If studyId is also present, the above condition already handles practice check
        // If only patientId is given, we need to ensure the patient belongs to the practice
        if (!studyId) {
             where.patient = { id: patientId, practiceId };
        } else {
            where.patientId = patientId;
        }
    }
    if (symptomTemplateId) {
        where.symptomTemplateId = symptomTemplateId;
    }
    if (startDate || endDate) {
        where.recordedAt = {};
        if (startDate) where.recordedAt.gte = startDate;
        if (endDate) where.recordedAt.lte = endDate;
    }

    try {
        const observations = await prisma.observation.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                recordedAt: 'desc', // Default order by newest first
            },
            // Include relevant details
            include: {
                symptomTemplate: { select: { id: true, name: true, units: true } },
                recordedBy: { select: { id: true, firstName: true, lastName: true } },
                patient: { select: { id: true, name: true } },
                // studyPatient: { include: { study: { select: { id: true, title: true } } } } // Optionally include study title
            },
        });

        const totalObservations = await prisma.observation.count({ where });

        return {
            observations,
            pagination: {
                total: totalObservations,
                page,
                limit,
                totalPages: Math.ceil(totalObservations / limit),
            },
        };
    } catch (error) {
        console.error('Error finding observations:', error);
        throw new AppError('Could not retrieve observations due to an internal error', 500);
    }
};

/**
 * Deletes a specific Observation.
 * Requires context (like practiceId) to ensure authorization.
 * @param observationId - ID of the observation to delete.
 * @param practiceId - ID of the practice for authorization.
 * @param userId - ID of the user performing the deletion (for permission checks if needed).
 * @returns True if deletion successful.
 * @throws AppError if not found, not authorized, or DB error.
 */
export const deleteObservation = async (observationId: string, practiceId: string, userId: string): Promise<boolean> => {
    // Authorization: Ensure the observation belongs to the user's practice.
    // This is slightly complex as Observation links to Practice via Patient or Study.
    // We check if the Observation's Patient belongs to the practice.
    // Add permission checks based on userId if needed (e.g., only creator or admin can delete).
    try {
        const deleteResult = await prisma.observation.deleteMany({
            where: {
                id: observationId,
                // Ensure the observation belongs to a patient within the user's practice
                patient: { practiceId: practiceId },
                // OR Ensure it belongs to a study within the user's practice
                // studyPatient: { study: { practiceId: practiceId } }
                // Choose one or combine depending on desired strictness
            },
        });

        if (deleteResult.count === 0) {
            throw new AppError('Observation not found or you do not have permission to delete it', 404);
        }

        return true;

    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error(`Error deleting observation ${observationId}:`, error);
        throw new AppError('Could not delete observation due to an internal error', 500);
    }
}; 