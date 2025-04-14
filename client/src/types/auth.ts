export enum UserRole {
  PRACTICE_MANAGER = 'PRACTICE_MANAGER',
  VETERINARIAN = 'VETERINARIAN',
  VET_TECHNICIAN = 'VET_TECHNICIAN',
  VET_ASSISTANT = 'VET_ASSISTANT',
  RECEPTIONIST = 'RECEPTIONIST',
  PET_OWNER = 'PET_OWNER', // For potential future client access
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  practiceName?: string; // Only for practice managers
  practiceId?: string;   // For staff members
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  practiceName: string;
  role: UserRole;
  termsAccepted: boolean;
} 