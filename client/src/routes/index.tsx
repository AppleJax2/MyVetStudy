import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoadingSpinner from '../components/LoadingSpinner'; // Import the new spinner
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
const SymptomsPage = lazy(() => import('../pages/SymptomsPage'));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SubscriptionPage = lazy(() => import('../pages/SubscriptionPage'));

// Remove the old LoadingFallback component
// const LoadingFallback = () => <div>Loading...</div>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // Use LoadingSpinner as the fallback for Suspense
      { index: true, element: <Suspense fallback={<LoadingSpinner />}><DashboardPage /></Suspense> }, // Dashboard as home
      { path: 'login', element: <Suspense fallback={<LoadingSpinner />}><LoginPage /></Suspense> }, // Use actual Login Page
      { path: 'register', element: <Suspense fallback={<LoadingSpinner />}><RegisterPage /></Suspense> }, // Use actual Register Page
      { path: 'monitoring-plans', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlansPage /></Suspense> },
      { path: 'monitoring-plans/:id', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlanDetailPage /></Suspense> },
      { path: 'monitoring-plans/:id/symptoms', element: <Suspense fallback={<LoadingSpinner />}><SymptomsPage /></Suspense> },
      { path: 'studies', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlansPage /></Suspense> },
      { path: 'studies/:studyId', element: <Suspense fallback={<LoadingSpinner />}><MonitoringPlanDetailPage /></Suspense> },
      { path: 'studies/:studyId/symptoms', element: <Suspense fallback={<LoadingSpinner />}><SymptomsPage /></Suspense> },
      { path: 'notifications', element: <Suspense fallback={<LoadingSpinner />}><NotificationsPage /></Suspense> },
      { path: 'profile', element: <Suspense fallback={<LoadingSpinner />}><ProfilePage /></Suspense> },
      { path: 'subscription', element: <Suspense fallback={<LoadingSpinner />}><SubscriptionPage /></Suspense> },
      // Add other routes as needed
    ],
  },
  // Add routes outside the main layout if necessary (e.g., a dedicated admin section)
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter; 