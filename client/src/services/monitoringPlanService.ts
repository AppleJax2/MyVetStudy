import api from './api';

export interface MonitoringPlan {
  id?: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  category: string;
  organizer: string;
  participants: string[];
  patientId?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SymptomEntry {
  id?: string;
  monitoringPlanId: string;
  date: string;
  symptomType: string;
  severity: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

// Get all monitoring plans
export const getMonitoringPlans = async (): Promise<MonitoringPlan[]> => {
  try {
    const response = await api.get('/monitoring-plans');
    return response.data;
  } catch (error) {
    console.error('Error fetching monitoring plans:', error);
    throw error;
  }
};

// Get monitoring plan by ID
export const getMonitoringPlanById = async (id: string): Promise<MonitoringPlan> => {
  try {
    const response = await api.get(`/monitoring-plans/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching monitoring plan with ID ${id}:`, error);
    throw error;
  }
};

// Create new monitoring plan
export const createMonitoringPlan = async (planData: MonitoringPlan): Promise<MonitoringPlan> => {
  try {
    const response = await api.post('/monitoring-plans', planData);
    return response.data;
  } catch (error) {
    console.error('Error creating monitoring plan:', error);
    throw error;
  }
};

// Update monitoring plan
export const updateMonitoringPlan = async (id: string, planData: MonitoringPlan): Promise<MonitoringPlan> => {
  try {
    const response = await api.put(`/monitoring-plans/${id}`, planData);
    return response.data;
  } catch (error) {
    console.error(`Error updating monitoring plan with ID ${id}:`, error);
    throw error;
  }
};

// Delete monitoring plan
export const deleteMonitoringPlan = async (id: string): Promise<void> => {
  try {
    await api.delete(`/monitoring-plans/${id}`);
  } catch (error) {
    console.error(`Error deleting monitoring plan with ID ${id}:`, error);
    throw error;
  }
};

// Get all symptom entries for a monitoring plan
export const getSymptomEntries = async (monitoringPlanId: string): Promise<SymptomEntry[]> => {
  try {
    const response = await api.get(`/monitoring-plans/${monitoringPlanId}/symptoms`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching symptoms for monitoring plan ID ${monitoringPlanId}:`, error);
    throw error;
  }
};

// Add a symptom entry to a monitoring plan
export const addSymptomEntry = async (monitoringPlanId: string, entryData: SymptomEntry): Promise<SymptomEntry> => {
  try {
    const response = await api.post(`/monitoring-plans/${monitoringPlanId}/symptoms`, entryData);
    return response.data;
  } catch (error) {
    console.error(`Error adding symptom entry to monitoring plan ID ${monitoringPlanId}:`, error);
    throw error;
  }
};

// Update a symptom entry
export const updateSymptomEntry = async (monitoringPlanId: string, entryId: string, entryData: SymptomEntry): Promise<SymptomEntry> => {
  try {
    const response = await api.put(`/monitoring-plans/${monitoringPlanId}/symptoms/${entryId}`, entryData);
    return response.data;
  } catch (error) {
    console.error(`Error updating symptom entry ID ${entryId}:`, error);
    throw error;
  }
};

// Delete a symptom entry
export const deleteSymptomEntry = async (monitoringPlanId: string, entryId: string): Promise<void> => {
  try {
    await api.delete(`/monitoring-plans/${monitoringPlanId}/symptoms/${entryId}`);
  } catch (error) {
    console.error(`Error deleting symptom entry ID ${entryId}:`, error);
    throw error;
  }
}; 