import prisma from '../utils/prisma.client';
import { Prisma, Sex } from '../generated/prisma';
import AppError from '../utils/appError';

/**
 * Creates a new patient record
 * @param data - Patient creation data
 * @param userId - ID of the user creating the patient
 * @param practiceId - ID of the practice the patient belongs to
 * @returns The created patient
 */
export const createPatient = async (
  data: Omit<Prisma.PatientCreateInput, 'createdBy' | 'practice' | 'practiceId' | 'createdById'>,
  userId: string,
  practiceId: string
) => {
  try {
    // Prepare data for Prisma create
    const createData: Prisma.PatientCreateInput = {
      ...data,
      practice: { connect: { id: practiceId } },
      createdBy: { connect: { id: userId } },
      // Initialize empty medical history if not provided
      medicalHistory: data.medicalHistory ?? { entries: [] },
    };

    // Create the patient record
    const patient = await prisma.patient.create({ data: createData });
    return patient;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error creating patient:', error);
    throw new AppError('Could not create patient due to an internal error', 500);
  }
};

/**
 * Finds patients associated with a practice, with optional filtering and pagination
 * @param practiceId - ID of the practice
 * @param options - Optional filtering and pagination options
 * @returns List of patients and pagination metadata
 */
export const findPatientsByPractice = async (
  practiceId: string,
  options: {
    search?: string;
    species?: string;
    isActive?: boolean;
    limit?: number;
    page?: number;
  } = {}
) => {
  const { search, species, isActive = true, limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  try {
    // Build the where clause based on filters
    const where: Prisma.PatientWhereInput = {
      practiceId,
      isActive,
    };

    // Add species filter if provided
    if (species) {
      where.species = species;
    }

    // Add search filter if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { breed: { contains: search, mode: 'insensitive' } },
        { ownerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get patients matching the criteria
    const patients = await prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      // Include related data as needed
      include: {
        _count: {
          select: {
            observations: true,
            treatments: true,
            monitoringPlans: true,
          },
        },
      },
    });

    // Get total count for pagination
    const totalPatients = await prisma.patient.count({ where });

    return {
      patients,
      pagination: {
        total: totalPatients,
        page,
        limit,
        totalPages: Math.ceil(totalPatients / limit),
      },
    };
  } catch (error) {
    console.error('Error finding patients:', error);
    throw new AppError('Could not retrieve patients due to an internal error', 500);
  }
};

/**
 * Finds a specific patient by ID
 * @param patientId - ID of the patient
 * @param practiceId - ID of the practice (for authorization)
 * @returns The patient object or null if not found
 */
export const findPatientById = async (patientId: string, practiceId: string) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        practiceId,
      },
      include: {
        monitoringPlans: {
          include: {
            monitoringPlan: {
              select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
        observations: {
          take: 5,
          orderBy: { recordedAt: 'desc' },
          include: {
            symptomTemplate: true,
          },
        },
        treatments: {
          take: 5,
          orderBy: { administeredAt: 'desc' },
        },
        files: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      return null;
    }

    return patient;
  } catch (error) {
    console.error(`Error finding patient ${patientId}:`, error);
    throw new AppError('Could not retrieve patient details due to an internal error', 500);
  }
};

/**
 * Updates an existing patient
 * @param patientId - ID of the patient to update
 * @param data - Update data
 * @param practiceId - ID of the practice (for authorization)
 * @returns The updated patient
 */
export const updatePatient = async (
  patientId: string,
  data: Partial<Omit<Prisma.PatientUpdateInput, 'createdBy' | 'practice'>>,
  practiceId: string
) => {
  try {
    // Verify the patient exists and belongs to the practice
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        practiceId,
      },
      select: { id: true },
    });

    if (!existingPatient) {
      throw new AppError('Patient not found or you do not have permission to update it', 404);
    }

    // Ensure fields like createdById and practiceId are not accidentally updated
    const { createdById, practiceId: _, ...updateData } = data;

    // Update the patient
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });

    return updatedPatient;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error(`Error updating patient ${patientId}:`, error);
    throw new AppError('Could not update patient due to an internal error', 500);
  }
};

/**
 * Deletes a patient record
 * @param patientId - ID of the patient to delete
 * @param practiceId - ID of the practice (for authorization)
 * @returns True if deletion was successful
 */
export const deletePatient = async (patientId: string, practiceId: string): Promise<boolean> => {
  try {
    // Use deleteMany with where clause to ensure patient belongs to the practice
    const deleteResult = await prisma.patient.deleteMany({
      where: {
        id: patientId,
        practiceId,
      },
    });

    // If count is 0, patient wasn't found or didn't belong to the practice
    if (deleteResult.count === 0) {
      throw new AppError('Patient not found or you do not have permission to delete it', 404);
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Handle potential Prisma errors (e.g., foreign key constraints)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003' || error.code === 'P2014') {
        console.error(`Deletion failed due to related records for patient ${patientId}:`, error);
        throw new AppError(
          'Cannot delete patient because it has associated records. Try making it inactive instead.',
          409
        );
      }
    }
    console.error(`Error deleting patient ${patientId}:`, error);
    throw new AppError('Could not delete patient due to an internal error', 500);
  }
};

/**
 * Searches for patients by name, owner, species, etc.
 * @param query - Search query
 * @param practiceId - ID of the practice
 * @returns List of matching patients
 */
export const searchPatients = async (query: string, practiceId: string) => {
  try {
    const patients = await prisma.patient.findMany({
      where: {
        practiceId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { ownerName: { contains: query, mode: 'insensitive' } },
          { breed: { contains: query, mode: 'insensitive' } },
          { species: { contains: query, mode: 'insensitive' } },
          { ownerEmail: { contains: query, mode: 'insensitive' } },
          { ownerPhone: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 20, // Limit results to prevent performance issues
    });

    return patients;
  } catch (error) {
    console.error(`Error searching patients with query "${query}":`, error);
    throw new AppError('Could not search patients due to an internal error', 500);
  }
};

/**
 * Gets a patient's health history
 * @param patientId - ID of the patient
 * @param practiceId - ID of the practice (for authorization)
 * @returns The patient's health history
 */
export const getPatientHealthHistory = async (patientId: string, practiceId: string) => {
  try {
    // Verify the patient exists and belongs to the practice
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        practiceId,
      },
      select: {
        id: true,
        medicalHistory: true,
      },
    });

    if (!patient) {
      throw new AppError('Patient not found or you do not have permission to view it', 404);
    }

    // Get observations and treatments for a complete history
    const observations = await prisma.observation.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
      include: {
        symptomTemplate: true,
        recordedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    const treatments = await prisma.treatment.findMany({
      where: { patientId },
      orderBy: { administeredAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Combine structured data with the medical history JSON
    return {
      medicalHistory: patient.medicalHistory,
      observations,
      treatments,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error(`Error getting health history for patient ${patientId}:`, error);
    throw new AppError('Could not retrieve health history due to an internal error', 500);
  }
};

/**
 * Adds a health history entry to a patient's record
 * @param patientId - ID of the patient
 * @param entry - Health history entry to add
 * @param userId - ID of the user adding the entry
 * @param practiceId - ID of the practice (for authorization)
 * @returns The updated patient
 */
export const addHealthHistoryEntry = async (
  patientId: string,
  entry: any,
  userId: string,
  practiceId: string
) => {
  try {
    // Verify the patient exists and belongs to the practice
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        practiceId,
      },
      select: {
        id: true,
        medicalHistory: true,
      },
    });

    if (!patient) {
      throw new AppError('Patient not found or you do not have permission to update it', 404);
    }

    // Get the current medical history, ensuring it's an object with an entries array
    const currentHistory = patient.medicalHistory as any || { entries: [] };
    if (!currentHistory.entries) {
      currentHistory.entries = [];
    }

    // Add the new entry with timestamp and user ID
    const newEntry = {
      ...entry,
      timestamp: new Date(),
      addedBy: userId,
    };

    currentHistory.entries.unshift(newEntry); // Add to the beginning of the array

    // Update the patient with the new medical history
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        medicalHistory: currentHistory,
      },
    });

    return updatedPatient;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error(`Error adding health history entry for patient ${patientId}:`, error);
    throw new AppError('Could not add health history entry due to an internal error', 500);
  }
}; 