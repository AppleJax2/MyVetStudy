import React from 'react';
// Remove incorrect layout import
// import MainLayout from '../layouts/MainLayout'; 
import MonitoringPlanList from '../components/MonitoringPlanList';
// Remove unused Container import if not needed elsewhere on page
// import { Container } from 'react-bootstrap';

const MonitoringPlanListPage: React.FC = () => {
  return (
    // Remove the layout wrapper
    // <MainLayout>
    // Use a simple div or fragment for the container if necessary
    <div className="container mx-auto px-4 py-4">
      {/* Adjust styling as needed - assuming tailwind container is used */}
      <MonitoringPlanList />
    </div>
    // </MainLayout>
  );
};

export default MonitoringPlanListPage; 