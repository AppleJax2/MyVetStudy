import api from './api';

/**
 * Interface for practice details
 */
export interface IPractice {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  customBranding?: Record<string, any> | null;
  maxStorage: number;
  currentStorage: number;
}

/**
 * Interface for practice statistics
 */
export interface IPracticeStatistics {
  summary: {
    totalPatients: number;
    activePatients: number;
    totalMonitoringPlans: number;
    activeMonitoringPlans: number;
    teamMembers: number;
    totalObservations: number;
    recentObservations: number;
  };
  patientsBySpecies: Array<{
    species: string;
    count: number;
  }>;
  monitoringPlansByStatus: Array<{
    status: string;
    count: number;
  }>;
  observationsTrend: Array<{
    date: string;
    count: number;
  }>;
  activityLog: Array<{
    id: string;
    type: string;
    description: string;
    userId: string;
    userName: string;
    timestamp: string;
  }>;
}

/**
 * Interface for team members
 */
export interface ITeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for subscription history
 */
export interface ISubscriptionHistory {
  id: string;
  tier: string;
  startDate: string;
  endDate: string | null;
  amount: number | null;
  paymentId: string | null;
  createdAt: string;
}

/**
 * Get practice details
 * @returns Practice details
 */
export const getPracticeDetails = async (): Promise<IPractice> => {
  const response = await api.get('/practice/details');
  return response.data.data;
};

/**
 * Update practice settings
 * @param settings Practice settings to update
 * @returns Updated practice details
 */
export const updatePracticeSettings = async (
  settings: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    customBranding?: Record<string, any>;
  }
): Promise<IPractice> => {
  const response = await api.put('/practice/settings', settings);
  return response.data.data;
};

/**
 * Upload practice logo
 * @param logoFile Logo file to upload
 * @returns URL of the uploaded logo
 */
export const uploadPracticeLogo = async (logoFile: File): Promise<string> => {
  const formData = new FormData();
  formData.append('logo', logoFile);

  const response = await api.post('/practice/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.logo;
};

/**
 * Get practice dashboard statistics
 * @returns Practice statistics
 */
export const getPracticeStatistics = async (): Promise<IPracticeStatistics> => {
  const response = await api.get('/practice/statistics');
  return response.data.data;
};

/**
 * Get practice staff members
 * @returns List of team members
 */
export const getPracticeStaff = async (): Promise<ITeamMember[]> => {
  const response = await api.get('/practice/staff');
  return response.data.data;
};

/**
 * Get practice subscription information
 * @returns Subscription information
 */
export const getSubscriptionInfo = async (): Promise<{
  current: {
    subscriptionTier: string;
    subscriptionStatus: string;
    subscriptionStartDate: string | null;
    subscriptionEndDate: string | null;
    maxStorage: number;
    currentStorage: number;
  };
  history: ISubscriptionHistory[];
}> => {
  const response = await api.get('/practice/subscription');
  return response.data.data;
}; 