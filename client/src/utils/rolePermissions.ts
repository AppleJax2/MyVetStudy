import { UserRole } from '../types/auth';

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
  // Practice Manager has all permissions
  [UserRole.PRACTICE_MANAGER]: Object.values(Permission),
  
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
  
  // Vet Technician has limited permissions
  [UserRole.VET_TECHNICIAN]: [
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
  
  // Vet Assistant has minimal permissions
  [UserRole.VET_ASSISTANT]: [
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
  
  // Pet Owner has very limited access (for future development)
  [UserRole.PET_OWNER]: [
    Permission.VIEW_MONITORING_PLAN,
    Permission.VIEW_PATIENT,
    Permission.RECORD_OBSERVATION,
  ],
};

/**
 * Check if a role has a specific permission
 * @param role User role to check
 * @param permission Permission to check
 * @returns boolean indicating if the role has the permission
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return rolePermissions[role].includes(permission);
};

/**
 * Check if a role has ALL of the specified permissions
 * @param role User role to check
 * @param permissions Array of permissions to check
 * @returns boolean indicating if the role has all the permissions
 */
export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Check if a role has ANY of the specified permissions
 * @param role User role to check
 * @param permissions Array of permissions to check
 * @returns boolean indicating if the role has at least one of the permissions
 */
export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a specific role
 * @param role User role
 * @returns Array of permissions assigned to the role
 */
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return [...rolePermissions[role]];
};

/**
 * Get all roles that have a specific permission
 * @param permission Permission to check
 * @returns Array of roles that have the permission
 */
export const getRolesWithPermission = (permission: Permission): UserRole[] => {
  return Object.entries(rolePermissions)
    .filter(([_, permissions]) => permissions.includes(permission))
    .map(([role, _]) => role as UserRole);
};

/**
 * Check if a role is higher in hierarchy than another role
 * @param role1 First role
 * @param role2 Second role to compare against
 * @returns boolean indicating if role1 has more permissions than role2
 */
export const isRoleHigherThan = (role1: UserRole, role2: UserRole): boolean => {
  const role1Permissions = rolePermissions[role1].length;
  const role2Permissions = rolePermissions[role2].length;
  return role1Permissions > role2Permissions;
};

/**
 * Get a hierarchical list of roles, from highest permissions to lowest
 * @returns Array of roles in hierarchical order
 */
export const getRoleHierarchy = (): UserRole[] => {
  return Object.entries(rolePermissions)
    .sort(([_, permissions1], [__, permissions2]) => 
      permissions2.length - permissions1.length
    )
    .map(([role, _]) => role as UserRole);
}; 