import { z } from 'zod';
import { SymptomDataType } from '../generated/prisma';

// Base schema for SymptomTemplate fields
const symptomTemplateBaseSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    category: z.string().max(50).optional(),
    dataType: z.nativeEnum(SymptomDataType),
    units: z.string().max(20).optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    options: z.record(z.any()).optional(), // For ENUMERATION type, could be refined (e.g., z.array(z.string()))
    // studyId is handled via route parameter
});

// Schema for creating a SymptomTemplate within a Study
export const createSymptomTemplateSchema = z.object({
    params: z.object({
        studyId: z.string().uuid('Invalid study ID format'),
    }),
    body: symptomTemplateBaseSchema,
});

// Schema for updating a SymptomTemplate
export const updateSymptomTemplateSchema = z.object({
    params: z.object({
        studyId: z.string().uuid('Invalid study ID format'),
        symptomId: z.string().uuid('Invalid symptom template ID format'),
    }),
    body: symptomTemplateBaseSchema.partial(), // All fields are optional for update
});

// Schema for getting/deleting a specific SymptomTemplate
export const symptomTemplateParamsSchema = z.object({
    params: z.object({
        studyId: z.string().uuid('Invalid study ID format'),
        symptomId: z.string().uuid('Invalid symptom template ID format'),
    }),
});

// Schema for listing SymptomTemplates within a Study
export const listSymptomTemplatesSchema = z.object({
    params: z.object({
        studyId: z.string().uuid('Invalid study ID format'),
    }),
    // Add query params for filtering/pagination if needed later
    // query: z.object({ ... }).optional()
});


// Type inference
export type CreateSymptomTemplateInput = z.infer<typeof createSymptomTemplateSchema>;
export type UpdateSymptomTemplateInput = z.infer<typeof updateSymptomTemplateSchema>;
export type SymptomTemplateParamsInput = z.infer<typeof symptomTemplateParamsSchema>;
export type ListSymptomTemplatesInput = z.infer<typeof listSymptomTemplatesSchema>; 