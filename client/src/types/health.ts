// We don't need to import User since we have the user shape inline
// import { User } from './auth';

// Represents a health note recorded for a patient
export interface IHealthNote {
  id: string;
  patientId: string;
  monitoringPlanPatientId: string;
  recordedById: string;
  recordedAt: string | Date;
  notes: string;
  recordedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// API response for health note operations
export interface IHealthNoteResponse {
  status: string;
  message: string;
  data: IHealthNote;
}

// API response for listing health notes 
export interface IHealthNotesListResponse {
  status: string;
  message: string;
  results: number;
  data: IHealthNote[];
} 