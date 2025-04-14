import { z } from 'zod';
import { Sex } from '../generated/prisma';

// Base schema for common patient fields
const patientBaseSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(255),
  species: z.string().min(1, 'Species is required').max(100),
  breed: z.string().optional(),
  age: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  sex: z.nativeEnum(Sex).optional(),
  
  // Owner information fields
  ownerName: z.string().min(1, 'Owner name is required').max(255),
  ownerEmail: z.string().email('Invalid email format').optional(),
  ownerPhone: z.string().optional(),
  
  // Optional fields
  isActive: z.boolean().optional().default(true),
  medicalHistory: z.record(z.any()).optional(),
});

// Schema for creating a new patient
export const createPatientSchema = z.object({
  body: patientBaseSchema,
});

// Schema for updating an existing patient
export const updatePatientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid patient ID format'),
  }),
  body: patientBaseSchema.partial(), // Makes all fields optional for updates
});

// Schema for retrieving a patient by ID
export const getPatientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid patient ID format'),
  }),
});

// Schema for adding a health history entry
export const healthHistoryEntrySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid patient ID format'),
  }),
  body: z.object({
    entry: z.object({
      type: z.string().min(1, 'Entry type is required'),
      description: z.string().min(1, 'Description is required'),
      date: z.coerce.date().optional().default(() => new Date()),
      details: z.record(z.any()).optional(),
    }),
  }),
});

// Type inference for controllers/services
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type GetPatientInput = z.infer<typeof getPatientSchema>;
export type HealthHistoryEntryInput = z.infer<typeof healthHistoryEntrySchema>; 