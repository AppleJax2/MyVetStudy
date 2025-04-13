import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
// Import page components
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
// import DashboardPage from '../pages/DashboardPage'; // Keep as placeholder for now
// import StudiesPage from '../pages/StudiesPage';
// import StudyDetailPage from '../pages/StudyDetailPage';
// import SymptomsPage from '../pages/SymptomsPage';
// import NotificationsPage from '../pages/NotificationsPage';
// import ProfilePage from '../pages/ProfilePage';
// import SubscriptionPage from '../pages/SubscriptionPage';

// Placeholder component for pages not yet created
const PlaceholderPage = ({ title }: { title: string }) => <h2>{title}</h2>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="Home Page (Dashboard)" /> }, // Dashboard as home
      { path: 'login', element: <LoginPage /> }, // Use actual Login Page
      { path: 'register', element: <RegisterPage /> }, // Use actual Register Page
      { path: 'studies', element: <PlaceholderPage title="Studies List Page" /> },
      { path: 'studies/:studyId', element: <PlaceholderPage title="Study Detail Page" /> },
      { path: 'studies/:studyId/symptoms', element: <PlaceholderPage title="Symptom Tracking Page" /> },
      { path: 'notifications', element: <PlaceholderPage title="Notifications Page" /> },
      { path: 'profile', element: <PlaceholderPage title="Profile Page" /> },
      { path: 'subscription', element: <PlaceholderPage title="Subscription Page" /> },
      // Add other routes as needed
    ],
  },
  // Add routes outside the main layout if necessary (e.g., a dedicated admin section)
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter; 