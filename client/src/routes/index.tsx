import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import ProtectedRoute from '../components/ProtectedRoute';
import { UserRole } from '../types/auth';
// Import page components
// import LoginPage from '../pages/LoginPage';
// import RegisterPage from '../pages/RegisterPage';
// import DashboardPage from '../pages/DashboardPage'; // Keep as placeholder for now
// import MonitoringPlansPage from '../pages/MonitoringPlansPage';
// import MonitoringPlanDetailPage from '../pages/MonitoringPlanDetailPage';
// import SymptomsPage from '../pages/SymptomsPage';
// import NotificationsPage from '../pages/NotificationsPage';
// import ProfilePage from '../pages/ProfilePage';
// import SubscriptionPage from '../pages/SubscriptionPage';

// Lazy load page components for code splitting
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const MonitoringPlansPage = lazy(() => import('../pages/MonitoringPlansPage'));
const MonitoringPlanDetailPage = lazy(() => import('../pages/MonitoringPlanDetailPage'));
const MonitoringPlanFormPage = lazy(() => import('../pages/MonitoringPlanFormPage'));
const MonitoringPlanDashboardPage = lazy(() => import('../pages/MonitoringPlanDashboardPage'));
const SharedMonitoringPlanPage = lazy(() => import('../pages/SharedMonitoringPlanPage'));
const ReportingPage = lazy(() => import('../pages/ReportingPage'));
const SymptomsPage = lazy(() => import('../pages/SymptomsPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SubscriptionPage = lazy(() => import('../pages/SubscriptionPage'));
const PatientsPage = lazy(() => import('../pages/PatientsPage'));
const PatientDetailPage = lazy(() => import('../pages/PatientDetailPage'));
const PatientFormPage = lazy(() => import('../pages/PatientFormPage'));

// Remove the old LoadingFallback component
// const LoadingFallback = () => <div>Loading...</div>;

const router = createBrowserRouter([
  {
    // Public routes (Login, Register, Shared Plan) - No MainLayout or ProtectedRoute
    path: '/login', 
    element: <Suspense fallback={<LoadingSpinner />}><LoginPage /></Suspense>
  },
  {
    path: '/register', 
    element: <Suspense fallback={<LoadingSpinner />}><RegisterPage /></Suspense>
  },
  {
    path: '/shared/monitoring-plan/:token', 
    element: <Suspense fallback={<LoadingSpinner />}><SharedMonitoringPlanPage /></Suspense>
  },
  {
    // Protected routes - Use MainLayout and ProtectedRoute
    path: '/',
    element: <MainLayout />,
    children: [
      // Common protected routes accessible to all authenticated users
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <Suspense fallback={<LoadingSpinner />}><DashboardPage /></Suspense> },
          { path: 'profile', element: <Suspense fallback={<LoadingSpinner />}><ProfilePage /></Suspense> },
          { path: 'notifications', element: <Suspense fallback={<LoadingSpinner />}><NotificationsPage /></Suspense> },
        ]
      },
      
      // Practice Manager only routes
      {
        element: <ProtectedRoute requiredRoles={UserRole.PRACTICE_MANAGER} />,
        children: [
          { path: 'subscription', element: <Suspense fallback={<LoadingSpinner />}><SubscriptionPage /></Suspense> },
        ]
      },
      
      // Routes accessible to Practice Managers and Veterinarians
      {
        element: <ProtectedRoute requiredRoles={[UserRole.PRACTICE_MANAGER, UserRole.VETERINARIAN]} />,
        children: [
          // Monitoring Plan Routes for creation/editing
          { path: 'monitoring-plans/new', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlanFormPage /></Suspense> },
          { path: 'monitoring-plans/:id/edit', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlanFormPage /></Suspense> },
        ]
      },
      
      // Routes accessible to all veterinary staff (not pet owners)
      {
        element: <ProtectedRoute requiredRoles={[
          UserRole.PRACTICE_MANAGER, 
          UserRole.VETERINARIAN, 
          UserRole.VET_TECHNICIAN, 
          UserRole.VET_ASSISTANT, 
          UserRole.RECEPTIONIST
        ]} />,
        children: [
          // Monitoring Plan Routes for viewing
          { path: 'monitoring-plans', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlansPage /></Suspense> },
          { path: 'monitoring-plans/:id', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlanDetailPage /></Suspense> },
          { path: 'monitoring-plans/:id/dashboard', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlanDashboardPage /></Suspense> },
          { path: 'monitoring-plans/:id/reports', element: <Suspense fallback={<LoadingSpinner />}><ReportingPage /></Suspense> },
          { path: 'monitoring-plans/:id/symptoms', element: <Suspense fallback={<LoadingSpinner />}><SymptomsPage /></Suspense> },
          
          // Legacy Study Routes (redirect handled within MonitoringPlansPage/MonitoringPlanDetailPage)
          { path: 'studies', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlansPage /></Suspense> },
          { path: 'studies/:studyId', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlanDetailPage /></Suspense> },
          { path: 'studies/:studyId/symptoms', element: <Suspense fallback={<LoadingSpinner />}><SymptomsPage /></Suspense> },
          
          // Patient Routes
          { path: 'patients', element: <Suspense fallback={<LoadingSpinner />}><PatientsPage /></Suspense> },
          { path: 'patients/new', element: <Suspense fallback={<LoadingSpinner />}><PatientFormPage /></Suspense> },
          { path: 'patients/:id', element: <Suspense fallback={<LoadingSpinner />}><PatientDetailPage /></Suspense> },
          { path: 'patients/:id/edit', element: <Suspense fallback={<LoadingSpinner />}><PatientFormPage /></Suspense> },
        ]
      }
    ]
  },
  // Add other top-level routes if necessary (e.g., a dedicated admin section without MainLayout)
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter; 