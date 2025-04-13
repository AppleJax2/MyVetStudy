import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
  return (
    <div>
      {/* Placeholder for Header */}
      <header>
        <h1>MyVetStudy</h1>
        {/* Add navigation links later */}
      </header>
      <main>
        <Outlet /> {/* Page content will be rendered here */}
      </main>
      {/* Placeholder for Footer */}
      <footer>
        <p>&copy; {new Date().getFullYear()} MyVetStudy. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout; 