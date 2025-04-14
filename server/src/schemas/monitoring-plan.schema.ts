import { z } from 'zod';
import { MonitoringPlanStatus, MonitoringPlanRole } from '../generated/prisma';

// Define the reminder configuration schema
const reminderConfigSchema = z.object({
    enabled: z.boolean().default(true),
    methods: z.object({
        email: z.boolean().default(true),
        push: z.boolean().default(true),
        sms: z.boolean().optional()
    }),
    schedule: z.object({
        sendBefore: z.number().int().min(0).default(15),
        missedDataReminder: z.boolean().default(true),
        reminderFrequency: z.enum(['once', 'hourly', 'daily']).default('daily')
    }),
    message: z.string().optional(),
    phoneNumber: z.string().optional(),
    recipientIds: z.array(z.string()).optional()
});

// Define the protocol schema for better type safety
const protocolSchema = z.object({
    frequency: z.object({
        times: z.number().int().positive(),
        period: z.enum(['DAY', 'WEEK', 'MONTH'])
    }),
    duration: z.number().int().positive(),
    reminderEnabled: z.boolean().default(true),
    shareableLink: z.boolean().default(false),
    timeSlots: z.array(z.string()).optional(),
    weeklyDays: z.array(z.number().int().min(0).max(6)).optional(),
    monthlyDays: z.array(z.number().int().min(1).max(31)).optional(),
    reminderConfig: reminderConfigSchema.optional()
});

// Base schema for common monitoring plan fields
const monitoringPlanBaseSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long').max(255),
    description: z.string().max(1000).optional(),
    protocol: protocolSchema,
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.nativeEnum(MonitoringPlanStatus).default(MonitoringPlanStatus.DRAFT),
    isTemplate: z.boolean().default(false),
});

// Schema for creating a new monitoring plan
export const createMonitoringPlanSchema = z.object({
    body: monitoringPlanBaseSchema,
});

// Schema for updating an existing monitoring plan
export const updateMonitoringPlanSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: monitoringPlanBaseSchema.partial(),
});

// Schema for updating patient assignments
export const updateMonitoringPlanPatientsSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        patientIds: z.array(z.string().uuid())
    })
});

// Schema for generating a shareable link
export const generateShareableLinkSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        expirationDays: z.number().int().min(0).default(30),
        isPublic: z.boolean().default(true)
    }).optional()
});

// Schema for retrieving a monitoring plan by share token
export const getMonitoringPlanByShareTokenSchema = z.object({
    params: z.object({
        token: z.string()
    })
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