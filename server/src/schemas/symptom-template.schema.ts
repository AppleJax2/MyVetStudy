import { z } from 'zod';

// Schema for creating a new symptom template
export const symptomTemplateSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid monitoring plan ID format'),
    }),
    body: z.object({
        name: z.string().min(1, 'Name is required').max(255),
        description: z.string().max(1000).optional(),
        category: z.string().max(100).optional(),
        dataType: z.enum(['NUMERIC', 'BOOLEAN', 'SCALE', 'ENUMERATION', 'TEXT', 'IMAGE']),
        units: z.string().max(50).optional(),
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
        options: z.record(z.any()).optional(), // For enumeration types
    }),
});

// Schema for updating a symptom template
export const updateSymptomTemplateSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid monitoring plan ID format'),
        symptomId: z.string().uuid('Invalid symptom template ID format'),
    }),
    body: symptomTemplateSchema.shape.body.partial(),
});

// Schema for deleting a symptom template
export const deleteSymptomTemplateSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid monitoring plan ID format'),
        symptomId: z.string().uuid('Invalid symptom template ID format'),
    }),
});

// Define TypeScript types from the Zod schemas
export type SymptomTemplateInput = z.infer<typeof symptomTemplateSchema>;
export type UpdateSymptomTemplateInput = z.infer<typeof updateSymptomTemplateSchema>;
export type DeleteSymptomTemplateInput = z.infer<typeof deleteSymptomTemplateSchema>; 