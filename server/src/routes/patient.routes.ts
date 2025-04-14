import express from 'express';
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientHealthHistory,
  addHealthHistoryEntry,
} from '../controllers/patient.controller';
import { authenticate, authorize, authorizeVeterinarianOrHigher } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createPatientSchema,
  updatePatientSchema,
  getPatientSchema,
  healthHistoryEntrySchema,
} from '../schemas/patient.schema';
import { UserRole } from '../../generated/prisma';

const router = express.Router();

// Apply authentication middleware to all patient routes
router.use(authenticate);

// --- Core Patient CRUD operations ---

// Get all patients (available to all authenticated users)
router.get('/', getPatients);

// Search patients (available to all authenticated users)
router.get('/search', searchPatients);

// Create patient (restricted to veterinarians and higher)
router.post(
  '/',
  authorizeVeterinarianOrHigher,
  validate(createPatientSchema),
  createPatient
);

// Get a specific patient by ID
router.get(
  '/:id',
  validate(getPatientSchema),
  getPatientById
);

// Update a patient (restricted to veterinarians and higher)
router.put(
  '/:id',
  authorizeVeterinarianOrHigher,
  validate(updatePatientSchema),
  updatePatient
);

// Delete a patient (restricted to veterinarians and higher)
router.delete(
  '/:id',
  authorizeVeterinarianOrHigher,
  validate(getPatientSchema),
  deletePatient
);

// --- Patient Health History ---

// Get a patient's health history
router.get(
  '/:id/health-history',
  validate(getPatientSchema),
  getPatientHealthHistory
);

// Add an entry to a patient's health history (restricted to veterinarians and higher)
router.post(
  '/:id/health-history',
  authorizeVeterinarianOrHigher,
  validate(healthHistoryEntrySchema),
  addHealthHistoryEntry
);

export default router; 