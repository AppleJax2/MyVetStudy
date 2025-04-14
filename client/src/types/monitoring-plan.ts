// Define enums directly in this file
export enum MonitoringPlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum SymptomDataType {
  NUMERIC = 'NUMERIC',
  BOOLEAN = 'BOOLEAN',
  SCALE = 'SCALE',
  ENUMERATION = 'ENUMERATION',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

export enum SymptomCategory {
  GENERAL = 'General',
  CARDIOVASCULAR = 'Cardiovascular',
  RESPIRATORY = 'Respiratory',
  GASTROINTESTINAL = 'Gastrointestinal',
  NEUROLOGICAL = 'Neurological',
  MUSCULOSKELETAL = 'Musculoskeletal',
  URINARY = 'Urinary',
  DERMATOLOGICAL = 'Dermatological',
  BEHAVIORAL = 'Behavioral',
  NUTRITIONAL = 'Nutritional',
  CUSTOM = 'Custom'
}

export interface FrequencySettings {
  times: number;
  period: 'DAY' | 'WEEK' | 'MONTH';
}

export interface MonitoringPlanProtocol {
  frequency: FrequencySettings;
  duration: number; // in days
  reminderEnabled: boolean;
  shareableLink: boolean;
  specificTimeOfDay?: string[]; // Array of times in HH:MM format for reminders
  daysOfWeek?: number[]; // Array of days (0-6, where 0 is Sunday) for weekly schedules
}

export interface SymptomTemplate {
  id?: string;
  name: string;
  description: string;
  category: string;
  dataType: SymptomDataType;
  units?: string;
  minValue?: number;
  maxValue?: number;
  options?: Record<string, any>;
  isNew?: boolean;
  modified?: boolean;
}

export interface MonitoringPlanFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: MonitoringPlanStatus;
  isTemplate: boolean;
  protocol: MonitoringPlanProtocol;
} 