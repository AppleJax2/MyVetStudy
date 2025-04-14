import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import '../index.css';
import InstallPWAButton from '../components/InstallPWAButton';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { Permission } from '../utils/rolePermissions';

const MainLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout, user, hasPermission } = useAuth();
  const navigate = useNavigate();
  
  const isActive = (path: string) => location.pathname === path;
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    if (isMenuOpen) {
      toggleMenu();
    }
    navigate('/login');
  };

  // Check if user is a practice manager
  const isPracticeManager = user?.role === UserRole.PRACTICE_MANAGER;
  // Check permissions for practice statistics and management
  const canViewPracticeStatistics = hasPermission(Permission.VIEW_PRACTICE_STATISTICS);
  const canManagePracticeSettings = hasPermission(Permission.MANAGE_PRACTICE_SETTINGS);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">MyVetStudy</Link>
          
          {isAuthenticated && (
            <button 
              className="md:hidden p-2 rounded focus:outline-none" 
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
          
          {isAuthenticated && (
            <nav className="hidden md:flex md:items-center">
              <ul className="flex space-x-6 mr-4">
                <li><Link to="/" className={`hover:text-blue-200 transition-colors ${isActive('/') ? 'font-bold' : ''}`}>Dashboard</Link></li>
                
                {/* Practice Manager specific links */}
                {isPracticeManager && (
                  <>
                    {canViewPracticeStatistics && (
                      <li>
                        <Link 
                          to="/practice/dashboard" 
                          className={`hover:text-blue-200 transition-colors ${isActive('/practice/dashboard') ? 'font-bold' : ''}`}
                        >
                          Practice Dashboard
                        </Link>
                      </li>
                    )}
                    
                    {canManagePracticeSettings && (
                      <li>
                        <Link 
                          to="/practice/settings" 
                          className={`hover:text-blue-200 transition-colors ${isActive('/practice/settings') ? 'font-bold' : ''}`}
                        >
                          Practice Settings
                        </Link>
                      </li>
                    )}
                    
                    <li>
                      <Link 
                        to="/team" 
                        className={`hover:text-blue-200 transition-colors ${isActive('/team') ? 'font-bold' : ''}`}
                      >
                        Team
                      </Link>
                    </li>
                  </>
                )}
                
                <li><Link to="/monitoring-plans" className={`hover:text-blue-200 transition-colors ${
                  isActive('/monitoring-plans') || location.pathname.startsWith('/monitoring-plans/') ? 'font-bold' : ''
                }`}>Monitoring Plans</Link></li>
                <li><Link to="/patients" className={`hover:text-blue-200 transition-colors ${isActive('/patients') || location.pathname.startsWith('/patients/') ? 'font-bold' : ''}`}>Patients</Link></li>
                <li><Link to="/notifications" className={`hover:text-blue-200 transition-colors ${isActive('/notifications') ? 'font-bold' : ''}`}>Notifications</Link></li>
                <li><Link to="/profile" className={`hover:text-blue-200 transition-colors ${isActive('/profile') ? 'font-bold' : ''}`}>Profile</Link></li>
                {isPracticeManager && (
                  <li><Link to="/subscription" className={`hover:text-blue-200 transition-colors ${isActive('/subscription') ? 'font-bold' : ''}`}>Subscription</Link></li>
                )}
              </ul>
              
              <div className="flex items-center space-x-3">
                <InstallPWAButton />
                <button 
                  onClick={handleLogout} 
                  className="bg-white text-blue-600 px-4 py-1 rounded-full font-semibold hover:bg-blue-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            </nav>
          )}
        </div>
        
        {isAuthenticated && isMenuOpen && (
          <nav className="md:hidden">
            <ul className="flex flex-col bg-blue-700 p-4">
              <li className="py-2"><Link to="/" className={`block ${isActive('/') ? 'font-bold' : ''}`} onClick={toggleMenu}>Dashboard</Link></li>
              
              {/* Practice Manager specific links - Mobile */}
              {isPracticeManager && (
                <>
                  {canViewPracticeStatistics && (
                    <li className="py-2">
                      <Link 
                        to="/practice/dashboard" 
                        className={`block ${isActive('/practice/dashboard') ? 'font-bold' : ''}`}
                        onClick={toggleMenu}
                      >
                        Practice Dashboard
                      </Link>
                    </li>
                  )}
                  
                  {canManagePracticeSettings && (
                    <li className="py-2">
                      <Link 
                        to="/practice/settings" 
                        className={`block ${isActive('/practice/settings') ? 'font-bold' : ''}`}
                        onClick={toggleMenu}
                      >
                        Practice Settings
                      </Link>
                    </li>
                  )}
                  
                  <li className="py-2">
                    <Link 
                      to="/team" 
                      className={`block ${isActive('/team') ? 'font-bold' : ''}`}
                      onClick={toggleMenu}
                    >
                      Team
                    </Link>
                  </li>
                </>
              )}
              
              <li className="py-2"><Link to="/monitoring-plans" className={`block ${
                isActive('/monitoring-plans') || location.pathname.startsWith('/monitoring-plans/') ? 'font-bold' : ''
              }`} onClick={toggleMenu}>Monitoring Plans</Link></li>
              <li className="py-2"><Link to="/patients" className={`block ${isActive('/patients') || location.pathname.startsWith('/patients/') ? 'font-bold' : ''}`} onClick={toggleMenu}>Patients</Link></li>
              <li className="py-2"><Link to="/notifications" className={`block ${isActive('/notifications') ? 'font-bold' : ''}`} onClick={toggleMenu}>Notifications</Link></li>
              <li className="py-2"><Link to="/profile" className={`block ${isActive('/profile') ? 'font-bold' : ''}`} onClick={toggleMenu}>Profile</Link></li>
              {isPracticeManager && (
                <li className="py-2"><Link to="/subscription" className={`block ${isActive('/subscription') ? 'font-bold' : ''}`} onClick={toggleMenu}>Subscription</Link></li>
              )}
              <li className="py-2 mt-4">
                <InstallPWAButton />
              </li>
              <li className="py-2 mt-2">
                <button 
                  onClick={handleLogout} 
                  className="block w-full bg-white text-blue-600 px-4 py-2 rounded-full font-semibold text-center"
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        )}
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>
      
      <footer className="bg-gray-800 text-gray-300 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; 2024 MyVetStudy. All rights reserved.</p>
            <div className="mt-4 md:mt-0">
              <Link to="/privacy" className="hover:text-white mr-4">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 