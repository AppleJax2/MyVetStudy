import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LoginCredentials, LoginResponse } from '../types/auth';

// Login validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Handle success message from registration or other redirects
  useEffect(() => {
    const state = location.state as { message?: string, from?: string };
    if (state?.message) {
      setSuccessMessage(state.message);
    }
  }, [location]);

  const handleSubmit = async (values: LoginCredentials, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      setLoginError(null);
      
      const response = await api.post<LoginResponse>('/auth/login', values);

      if (response.data && response.data.token) {
        login(response.data.token, response.data.user);
        
        // Get redirect path from location state or default to dashboard
        const state = location.state as { from?: string };
        const redirectPath = state?.from || '/';
        
        navigate(redirectPath);
      } else {
        throw new Error('Login failed: No token received');
      }

    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = 'Invalid email or password. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setLoginError(errorMessage);

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-12 fade-in">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue to MyVetStudy</p>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        {loginError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <span className="block sm:inline">{loginError}</span>
          </div>
        )}

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <Field 
                  id="email" 
                  name="email" 
                  type="email" 
                  className="form-input" 
                  placeholder="john.doe@example.com" 
                />
                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="form-label">Password</label>
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                    Forgot password?
                  </Link>
                </div>
                <Field 
                  id="password" 
                  name="password" 
                  type="password" 
                  className="form-input" 
                />
                <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div className="form-group">
                <button 
                  type="submit" 
                  className="btn-primary w-full flex justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Create a practice account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 