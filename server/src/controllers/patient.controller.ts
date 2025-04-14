import { Request, Response, NextFunction } from 'express';
import * as patientService from '../services/patient.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import AppError from '../utils/appError';
import { CreatePatientInput, UpdatePatientInput } from '../schemas/patient.schema';

/**
 * Create a new patient (pet) record
 */
export const createPatient = async (
  req: AuthenticatedRequest<{}, {}, CreatePatientInput['body']>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id || !req.user?.practiceId) {
      return next(new AppError('Authentication details missing', 401));
    }

    const patientData = req.body;
    const userId = req.user.id;
    const practiceId = req.user.practiceId;

    const newPatient = await patientService.createPatient(patientData, userId, practiceId);

    res.status(201).json({
      status: 'success',
      message: 'Patient created successfully',
      data: {
        patient: newPatient,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all patients for a practice with filtering and pagination
 */
export const getPatients = async (
  req: AuthenticatedRequest,
  res: Response, 
  next: NextFunction
) => {
  try {
    if (!req.user?.practiceId) {
      return next(new AppError('Practice ID missing from authenticated user', 401));
    }

    // Extract query parameters for filtering and pagination
    const { search, species, isActive } = req.query;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

    const options = {
      search: search as string | undefined,
      species: species as string | undefined,
      isActive: isActive === 'true',
      limit: isNaN(limit) || limit <= 0 ? 10 : limit,
      page: isNaN(page) || page <= 0 ? 1 : page,
    };

    const result = await patientService.findPatientsByPractice(req.user.practiceId, options);

    res.status(200).json({
      status: 'success',
      message: 'Patients retrieved successfully',
      data: result.patients,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific patient by ID
 */
export const getPatientById = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.params.id;
    
    if (!req.user?.practiceId) {
      return next(new AppError('Practice ID missing from authenticated user', 401));
    }

    const patient = await patientService.findPatientById(patientId, req.user.practiceId);

    if (!patient) {
      return next(new AppError('Patient not found or you do not have permission to view it', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Patient details retrieved successfully',
      data: {
        patient,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a patient record
 */
export const updatePatient = async (
  req: AuthenticatedRequest<{ id: string }, {}, UpdatePatientInput['body']>,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.params.id;
    const updateData = req.body;

    if (!req.user?.practiceId) {
      return next(new AppError('Practice ID missing from authenticated user', 401));
    }

    // Check if there's any data to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ status: 'fail', message: 'No update data provided' });
    }

    const updatedPatient = await patientService.updatePatient(patientId, updateData, req.user.practiceId);

    res.status(200).json({
      status: 'success',
      message: 'Patient updated successfully',
      data: {
        patient: updatedPatient,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a patient record
 */
export const deletePatient = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.params.id;

    if (!req.user?.practiceId) {
      return next(new AppError('Practice ID missing from authenticated user', 401));
    }

    await patientService.deletePatient(patientId, req.user.practiceId);

    // Send 204 No Content on successful deletion
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Search patients by name or other criteria
 */
export const searchPatients = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.practiceId) {
      return next(new AppError('Practice ID missing from authenticated user', 401));
    }

    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'Search query is required',
      });
    }

    const patients = await patientService.searchPatients(query, req.user.practiceId);

    res.status(200).json({
      status: 'success',
      message: 'Search results retrieved successfully',
      data: {
        patients,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a patient's health history
 */
export const getPatientHealthHistory = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.params.id;
    
    if (!req.user?.practiceId) {
      return next(new AppError('Practice ID missing from authenticated user', 401));
    }

    const history = await patientService.getPatientHealthHistory(patientId, req.user.practiceId);

    res.status(200).json({
      status: 'success',
      message: 'Patient health history retrieved successfully',
      data: {
        history,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add health history entry to a patient's record
 */
export const addHealthHistoryEntry = async (
  req: AuthenticatedRequest<{ id: string }, {}, { entry: any }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.params.id;
    const historyEntry = req.body.entry;
    
    if (!req.user?.id || !req.user?.practiceId) {
      return next(new AppError('Authentication details missing', 401));
    }

    if (!historyEntry) {
      return res.status(400).json({
        status: 'fail',
        message: 'History entry is required',
      });
    }

    const updatedPatient = await patientService.addHealthHistoryEntry(
      patientId,
      historyEntry,
      req.user.id,
      req.user.practiceId
    );

    res.status(200).json({
      status: 'success',
      message: 'Health history entry added successfully',
      data: {
        patient: updatedPatient,
      },
    });
  } catch (error) {
    next(error);
  }
}; 