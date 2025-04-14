import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner'; // Assuming you have a LoadingSpinner component
import { UserRole } from '../types/auth';
import { Permission } from '../utils/rolePermissions';

interface ProtectedRouteProps {
  requiredRoles?: UserRole | UserRole[];
  requiredPermissions?: Permission | Permission[];
  requireAllPermissions?: boolean; // If true, user must have ALL permissions; if false, ANY permission is sufficient
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRoles, 
  requiredPermissions,
  requireAllPermissions = true
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    hasRole, 
    hasPermission, 
    hasAllPermissions,
    hasAnyPermission 
  } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show loading indicator while checking auth status
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login page with intended destination
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role-based access if required
  if (requiredRoles && !hasRole(requiredRoles)) {
    // Redirect to dashboard with unauthorized message
    return <Navigate to="/" state={{ 
      error: "You don't have permission to access that page."
    }} replace />;
  }

  // Check permission-based access if required
  if (requiredPermissions) {
    let hasAccess = false;
    
    if (Array.isArray(requiredPermissions)) {
      // Check if user has ALL required permissions or ANY required permission
      hasAccess = requireAllPermissions 
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
    } else {
      // Single permission check
      hasAccess = hasPermission(requiredPermissions);
    }
    
    if (!hasAccess) {
      // Redirect to dashboard with unauthorized message
      return <Navigate to="/" state={{ 
        error: "You don't have the required permissions to access that page."
      }} replace />;
    }
  }

  // Render the child route component if authenticated and authorized
  return <Outlet />;
};

export default ProtectedRoute; 