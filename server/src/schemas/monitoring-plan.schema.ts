import { z } from 'zod';
import { MonitoringPlanStatus, MonitoringPlanRole } from '../generated/prisma';

// Base schema for common monitoring plan fields
const monitoringPlanBaseSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long').max(255),
    description: z.string().max(1000).optional(),
    protocol: z.record(z.any()).optional(), // Assuming protocol is a JSON object
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

// Type inference for controllers/services
export type CreateMonitoringPlanInput = z.infer<typeof createMonitoringPlanSchema>;
export type UpdateMonitoringPlanInput = z.infer<typeof updateMonitoringPlanSchema>;
export type MonitoringPlanPatientInput = z.infer<typeof monitoringPlanPatientSchema>;
export type MonitoringPlanAssignmentInput = z.infer<typeof monitoringPlanAssignmentSchema>; 