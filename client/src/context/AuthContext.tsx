import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Assuming api service is set up for requests
import { User, UserRole } from '../types/auth'; // Import User type

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null; // Use User type
  login: (token: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean; // Add loading state
  hasRole: (roles: UserRole | UserRole[]) => boolean; // Add role checking function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse stored user data:", error);
          // Fetch fresh user data if stored data is invalid
          fetchUserData(storedToken);
        }
      } else {
        // No stored user data, fetch from API
        fetchUserData(storedToken);
      }
    } else {
      setIsLoading(false);
    }
  }, []);
  
  // Function to fetch user data based on token
  const fetchUserData = async (authToken: string) => {
    try {
      // Replace with your actual endpoint to get user profile
      const response = await api.get('/auth/profile');
      setUser(response.data);
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      logout(); // Log out if fetching user fails (e.g., invalid token)
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Function to check if user has specific role(s)
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      token, 
      user, 
      login, 
      logout, 
      isLoading,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 