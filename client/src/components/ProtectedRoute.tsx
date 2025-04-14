import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner'; // Assuming you have a LoadingSpinner component
import { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  requiredRoles?: UserRole | UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show loading indicator while checking auth status
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to login page with intended destination
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If route requires specific roles and user doesn't have them
  if (requiredRoles && !hasRole(requiredRoles)) {
    // Redirect to dashboard with unauthorized message
    return <Navigate to="/" state={{ 
      error: "You don't have permission to access that page."
    }} replace />;
  }

  // Render the child route component if authenticated and authorized
  return <Outlet />;
};

export default ProtectedRoute; 