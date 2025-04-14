import { UserRole } from '@prisma/client';

/**
 * Permission schema that maps application actions to roles
 */
export enum Permission {
  // Practice management
  MANAGE_PRACTICE_SETTINGS = 'manage_practice_settings',
  VIEW_PRACTICE_STATISTICS = 'view_practice_statistics',
  
  // Team management
  INVITE_TEAM_MEMBERS = 'invite_team_members',
  MANAGE_TEAM_ROLES = 'manage_team_roles',
  VIEW_TEAM_MEMBERS = 'view_team_members',
  
  // Monitoring plans
  CREATE_MONITORING_PLAN = 'create_monitoring_plan',
  EDIT_MONITORING_PLAN = 'edit_monitoring_plan',
  VIEW_MONITORING_PLAN = 'view_monitoring_plan',
  DELETE_MONITORING_PLAN = 'delete_monitoring_plan',
  SHARE_MONITORING_PLAN = 'share_monitoring_plan',
  
  // Patient management
  CREATE_PATIENT = 'create_patient',
  EDIT_PATIENT = 'edit_patient',
  VIEW_PATIENT = 'view_patient',
  DELETE_PATIENT = 'delete_patient',
  
  // Symptoms and observations
  CREATE_SYMPTOM = 'create_symptom',
  EDIT_SYMPTOM = 'edit_symptom',
  VIEW_SYMPTOM = 'view_symptom',
  DELETE_SYMPTOM = 'delete_symptom',
  RECORD_OBSERVATION = 'record_observation',
  
  // Reporting
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',
  
  // Subscriptions
  MANAGE_SUBSCRIPTIONS = 'manage_subscriptions',
}

/**
 * Permission map for each role
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  // Practice Owner (renamed from Practice Manager) has all permissions
  [UserRole.PRACTICE_OWNER]: Object.values(Permission),
  
  // Veterinarian has most permissions except practice and subscription management
  [UserRole.VETERINARIAN]: [
    Permission.VIEW_PRACTICE_STATISTICS,
    Permission.VIEW_TEAM_MEMBERS,
    
    Permission.CREATE_MONITORING_PLAN,
    Permission.EDIT_MONITORING_PLAN,
    Permission.VIEW_MONITORING_PLAN,
    Permission.SHARE_MONITORING_PLAN,
    
    Permission.CREATE_PATIENT,
    Permission.EDIT_PATIENT,
    Permission.VIEW_PATIENT,
    
    Permission.CREATE_SYMPTOM,
    Permission.EDIT_SYMPTOM,
    Permission.VIEW_SYMPTOM,
    Permission.DELETE_SYMPTOM,
    Permission.RECORD_OBSERVATION,
    
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
  ],
  
  // Technician has limited permissions
  [UserRole.TECHNICIAN]: [
    Permission.VIEW_TEAM_MEMBERS,
    
    Permission.VIEW_MONITORING_PLAN,
    Permission.SHARE_MONITORING_PLAN,
    
    Permission.VIEW_PATIENT,
    Permission.EDIT_PATIENT,
    
    Permission.VIEW_SYMPTOM,
    Permission.RECORD_OBSERVATION,
    
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
  ],
  
  // Assistant has minimal permissions
  [UserRole.ASSISTANT]: [
    Permission.VIEW_TEAM_MEMBERS,
    
    Permission.VIEW_MONITORING_PLAN,
    
    Permission.VIEW_PATIENT,
    
    Permission.VIEW_SYMPTOM,
    Permission.RECORD_OBSERVATION,
    
    Permission.VIEW_REPORTS,
  ],
  
  // Receptionist can view information and help with patient registration
  [UserRole.RECEPTIONIST]: [
    Permission.VIEW_TEAM_MEMBERS,
    
    Permission.VIEW_MONITORING_PLAN,
    
    Permission.CREATE_PATIENT,
    Permission.EDIT_PATIENT,
    Permission.VIEW_PATIENT,
    
    Permission.VIEW_SYMPTOM,
    
    Permission.VIEW_REPORTS,
  ],
};

/**
 * Get permissions for a specific role
 * @param role - User role
 * @returns Array of permissions
 */
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return rolePermissions[role] || [];
};

/**
 * Check if a role has a specific permission
 * @param role - User role
 * @param permission - Permission to check
 * @returns True if role has permission
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
};

/**
 * Get all roles that have a specific permission
 * @param permission - Permission to check
 * @returns Array of roles with the permission
 */
export const getRolesWithPermission = (permission: Permission): UserRole[] => {
  return Object.entries(rolePermissions)
    .filter(([_, permissions]) => permissions.includes(permission))
    .map(([role]) => role as UserRole);
}; 