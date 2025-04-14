import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Patient {
  id?: string;
  name: string;
  species: string;
  breed: string;
  gender: string;
  color: string;
  birthDate: string;
  microchipId: string;
  status: string;
  notes: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAddress: string;
  createdAt?: string;
  updatedAt?: string;
}

// Get all patients
export const getPatients = async (): Promise<Patient[]> => {
  try {
    const response = await axios.get(`${API_URL}/patients`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

// Get patient by ID
export const getPatientById = async (id: string): Promise<Patient> => {
  try {
    const response = await axios.get(`${API_URL}/patients/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching patient with ID ${id}:`, error);
    throw error;
  }
};

// Create new patient
export const createPatient = async (patientData: Patient): Promise<Patient> => {
  try {
    const response = await axios.post(`${API_URL}/patients`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

// Update patient
export const updatePatient = async (id: string, patientData: Patient): Promise<Patient> => {
  try {
    const response = await axios.put(`${API_URL}/patients/${id}`, patientData);
    return response.data;
  } catch (error) {
    console.error(`Error updating patient with ID ${id}:`, error);
    throw error;
  }
};

// Delete patient
export const deletePatient = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/patients/${id}`);
  } catch (error) {
    console.error(`Error deleting patient with ID ${id}:`, error);
    throw error;
  }
}; 