import axios from 'axios';
import { IHealthNote, IHealthNoteResponse, IHealthNotesListResponse } from '../types/health';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Retrieves all health notes for a specific patient's monitoring plan enrollment
 */
export const getHealthNotes = async (patientId: string, monitoringPlanPatientId: string): Promise<IHealthNote[]> => {
  try {
    const response = await axios.get<IHealthNotesListResponse>(
      `${API_URL}/patients/${patientId}/plan-enrollments/${monitoringPlanPatientId}/health-notes`
    );
    return response.data.data; // Return the data array directly
  } catch (error) {
    console.error('Error fetching health notes:', error);
    throw error;
  }
};

/**
 * Creates a new health note for a specific patient's monitoring plan enrollment
 */
export const createHealthNote = async (
  patientId: string,
  monitoringPlanPatientId: string,
  notes: string
): Promise<IHealthNote> => {
  try {
    const response = await axios.post<IHealthNoteResponse>(
      `${API_URL}/patients/${patientId}/plan-enrollments/${monitoringPlanPatientId}/health-notes`,
      { notes }
    );
    return response.data.data; // Return the created object directly
  } catch (error) {
    console.error('Error creating health note:', error);
    throw error;
  }
}; 