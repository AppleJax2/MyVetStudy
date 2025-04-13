import { z } from 'zod';

// Base schema for creating an Observation
// Note: Validation of the 'value' field against the SymptomTemplate's dataType is complex
// and best handled in the service layer after fetching the template details.
const observationBaseSchema = z.object({
    symptomTemplateId: z.string().uuid('Invalid symptom template ID format'),
    patientId: z.string().uuid('Invalid patient ID format'),
    // studyPatientId is derived in the service layer based on studyId and patientId
    // recordedById is derived from the authenticated user
    // recordedAt is handled by Prisma default
    value: z.any(), // Intentionally loose here, validated in service
    notes: z.string().max(1000).optional(),
    // files: z.array(z.string().uuid()).optional(), // If file uploads are linked
});

// Schema for creating an Observation within a Study
export const createObservationSchema = z.object({
    params: z.object({
        studyId: z.string().uuid('Invalid study ID format'),
        // patientId could also be in params depending on route structure
    }),
    body: observationBaseSchema,
});

// Schema for listing Observations (could be by study, patient, or study+patient)
// Example: List by Study and Patient
export const listObservationsSchema = z.object({
    params: z.object({
        studyId: z.string().uuid('Invalid study ID format'),
        patientId: z.string().uuid('Invalid patient ID format'),
    }),
    query: z.object({
        symptomTemplateId: z.string().uuid().optional(), // Filter by specific symptom
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        limit: z.coerce.number().int().positive().optional().default(25),
        page: z.coerce.number().int().positive().optional().default(1),
    }).optional(),
});

// Schema for getting/deleting a specific Observation
export const observationParamsSchema = z.object({
    params: z.object({
        // Need context like studyId/patientId depending on route
        observationId: z.string().uuid('Invalid observation ID format'),
    }),
});

// Type inference
export type CreateObservationInput = z.infer<typeof createObservationSchema>;
export type ListObservationsInput = z.infer<typeof listObservationsSchema>;
export type ObservationParamsInput = z.infer<typeof observationParamsSchema>;

// Potentially add update schema if observations are mutable
// export const updateObservationSchema = ... 