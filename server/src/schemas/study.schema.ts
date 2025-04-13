import { z } from 'zod';
import { StudyStatus, StudyRole } from '../generated/prisma'; // Corrected path

// Base schema for common study fields
const studyBaseSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long').max(255),
    description: z.string().max(1000).optional(),
    protocol: z.record(z.any()).optional(), // Assuming protocol is a JSON object
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.nativeEnum(StudyStatus).optional().default(StudyStatus.DRAFT),
    isTemplate: z.boolean().optional().default(false),
});

// Schema for creating a new study
export const createStudySchema = z.object({
    body: studyBaseSchema,
});

// Schema for updating an existing study (most fields are optional)
export const updateStudySchema = z.object({
    params: z.object({
        studyId: z.string().uuid('Invalid study ID format'),
    }),
    body: studyBaseSchema.partial(), // Makes all fields in base optional
});

// Schema for adding/removing a patient to/from a study
export const studyPatientSchema = z.object({
    params: z.object({
        studyId: z.string().uuid('Invalid study ID format'),
        patientId: z.string().uuid('Invalid patient ID format'),
    }),
});

// Schema for assigning/unassigning a user to/from a study
export const studyAssignmentSchema = z.object({
    params: z.object({
        studyId: z.string().uuid('Invalid study ID format'),
        userId: z.string().uuid('Invalid user ID format'),
    }),
    body: z.object({
        role: z.nativeEnum(StudyRole), // Role is required when assigning
    }).optional(), // Body is optional for unassigning
});

// Type inference for controllers/services
export type CreateStudyInput = z.infer<typeof createStudySchema>;
export type UpdateStudyInput = z.infer<typeof updateStudySchema>;
export type StudyPatientInput = z.infer<typeof studyPatientSchema>;
export type StudyAssignmentInput = z.infer<typeof studyAssignmentSchema>; 