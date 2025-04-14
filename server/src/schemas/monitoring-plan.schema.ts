import { z } from 'zod';
import { MonitoringPlanStatus, MonitoringPlanRole } from '../generated/prisma';

// Define the protocol schema for better type safety
const protocolSchema = z.object({
    frequency: z.object({
        times: z.number().int().positive(),
        period: z.enum(['DAY', 'WEEK', 'MONTH'])
    }).optional(),
    duration: z.number().int().positive().optional(),
    reminderEnabled: z.boolean().optional(),
    shareableLink: z.boolean().optional()
});

// Base schema for common monitoring plan fields
const monitoringPlanBaseSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long').max(255),
    description: z.string().max(1000).optional(),
    protocol: protocolSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.nativeEnum(MonitoringPlanStatus).optional().default(MonitoringPlanStatus.DRAFT),
    isTemplate: z.boolean().optional().default(false),
});

// Schema for creating a new monitoring plan
export const createMonitoringPlanSchema = z.object({
    body: monitoringPlanBaseSchema,
});

// Schema for updating an existing monitoring plan (most fields are optional)
export const updateMonitoringPlanSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid monitoring plan ID format'),
    }),
    body: monitoringPlanBaseSchema.partial(), // Makes all fields in base optional
});

// Schema for adding/removing a patient to/from a monitoring plan
export const monitoringPlanPatientSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid monitoring plan ID format'),
        patientId: z.string().uuid('Invalid patient ID format'),
    }),
});

// Schema for assigning/unassigning a user to/from a monitoring plan
export const monitoringPlanAssignmentSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid monitoring plan ID format'),
        userId: z.string().uuid('Invalid user ID format'),
    }),
    body: z.object({
        role: z.nativeEnum(MonitoringPlanRole), // Role is required when assigning
    }).optional(), // Body is optional for unassigning
});

// Schemas for symptom templates
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

export const updateSymptomTemplateSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid monitoring plan ID format'),
        symptomId: z.string().uuid('Invalid symptom template ID format'),
    }),
    body: symptomTemplateSchema.shape.body.partial(),
});

export const deleteSymptomTemplateSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid monitoring plan ID format'),
        symptomId: z.string().uuid('Invalid symptom template ID format'),
    }),
});

// Define TypeScript types from the Zod schemas
export type CreateMonitoringPlanInput = z.infer<typeof createMonitoringPlanSchema>;
export type UpdateMonitoringPlanInput = z.infer<typeof updateMonitoringPlanSchema>;
export type MonitoringPlanPatientInput = z.infer<typeof monitoringPlanPatientSchema>;
export type MonitoringPlanAssignmentInput = z.infer<typeof monitoringPlanAssignmentSchema>;
export type SymptomTemplateInput = z.infer<typeof symptomTemplateSchema>;
export type UpdateSymptomTemplateInput = z.infer<typeof updateSymptomTemplateSchema>;
export type DeleteSymptomTemplateInput = z.infer<typeof deleteSymptomTemplateSchema>; 