import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { UserRole, RegistrationData } from '../types/auth';

// Enhanced registration validation schema with veterinary focus
const RegisterSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  practiceName: Yup.string()
    .required('Veterinary practice name is required')
    .min(2, 'Practice name must be at least 2 characters'),
  practiceSize: Yup.string()
    .required('Please select your practice size'),
  practiceType: Yup.string()
    .required('Please select your practice type'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  termsAccepted: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
});

// Practice size options
const practiceSizeOptions = [
  { value: 'solo', label: 'Solo Practitioner' },
  { value: 'small', label: 'Small (2-5 veterinarians)' },
  { value: 'medium', label: 'Medium (6-15 veterinarians)' },
  { value: 'large', label: 'Large (16+ veterinarians)' },
  { value: 'hospital', label: 'Veterinary Hospital' },
  { value: 'educational', label: 'Educational Institution' }
];

// Practice type options
const practiceTypeOptions = [
  { value: 'small-animal', label: 'Small Animal' },
  { value: 'large-animal', label: 'Large Animal' },
  { value: 'mixed', label: 'Mixed Practice' },
  { value: 'exotic', label: 'Exotic Animal' },
  { value: 'emergency', label: 'Emergency & Critical Care' },
  { value: 'specialty', label: 'Specialty Practice' },
  { value: 'mobile', label: 'Mobile Practice' },
  { value: 'other', label: 'Other' }
];

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  practiceName: string;
  practiceSize: string;
  practiceType: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleSubmit = async (values: RegisterFormValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      setRegisterError(null);
      
      // Create registration data with practice manager role
      const registrationData: RegistrationData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        practiceName: values.practiceName,
        role: UserRole.PRACTICE_MANAGER,
        termsAccepted: values.termsAccepted,
        practiceProfile: {
          size: values.practiceSize,
          type: values.practiceType
        }
      };
      
      // Make API call to register
      const response = await api.post('/auth/register', registrationData);
      
      // Navigate to login with success message
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please log in to your new practice manager account.' 
        } 
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred during registration. Please try again.';
      setRegisterError(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-12 fade-in">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Veterinary Practice Account</h1>
          <p className="text-gray-600">Sign up as a Practice Manager to start monitoring your patients effectively</p>
        </div>

        {registerError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <span className="block sm:inline">{registerError}</span>
          </div>
        )}

        <Formik
          initialValues={{ 
            firstName: '',
            lastName: '',
            email: '',
            practiceName: '',
            practiceSize: '',
            practiceType: '',
            password: '',
            confirmPassword: '',
            termsAccepted: false
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                <h2 className="text-lg font-medium text-blue-800 mb-2">Practice Manager Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">First Name</label>
                    <Field 
                      id="firstName" 
                      name="firstName" 
                      type="text" 
                      className="form-input" 
                      placeholder="John" 
                    />
                    <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">Last Name</label>
                    <Field 
                      id="lastName" 
                      name="lastName" 
                      type="text" 
                      className="form-input" 
                      placeholder="Doe" 
                    />
                    <ErrorMessage name="lastName" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <Field 
                      id="email" 
                      name="email" 
                      type="email" 
                      className="form-input" 
                      placeholder="john.doe@vetpractice.com" 
                    />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-100">
                <h2 className="text-lg font-medium text-green-800 mb-2">Practice Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group md:col-span-2">
                    <label htmlFor="practiceName" className="form-label">Practice Name</label>
                    <Field 
                      id="practiceName" 
                      name="practiceName" 
                      type="text" 
                      className="form-input" 
                      placeholder="Happy Pets Veterinary Clinic" 
                    />
                    <ErrorMessage name="practiceName" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="practiceSize" className="form-label">Practice Size</label>
                    <Field 
                      as="select"
                      id="practiceSize" 
                      name="practiceSize" 
                      className="form-select" 
                    >
                      <option value="">Select Practice Size</option>
                      {practiceSizeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="practiceSize" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="practiceType" className="form-label">Practice Type</label>
                    <Field 
                      as="select"
                      id="practiceType" 
                      name="practiceType" 
                      className="form-select" 
                    >
                      <option value="">Select Practice Type</option>
                      {practiceTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Field>
                    <ErrorMessage name="practiceType" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                <h2 className="text-lg font-medium text-gray-700 mb-2">Account Security</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <Field 
                      id="password" 
                      name="password" 
                      type="password" 
                      className="form-input" 
                    />
                    <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <Field 
                      id="confirmPassword" 
                      name="confirmPassword" 
                      type="password" 
                      className="form-input" 
                    />
                    <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="flex items-center">
                  <Field 
                    type="checkbox" 
                    name="termsAccepted" 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to the <Link to="/terms" className="text-blue-600 hover:text-blue-800">Terms and Conditions</Link> and 
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-800 ml-1">Privacy Policy</Link>
                  </span>
                </label>
                <ErrorMessage name="termsAccepted" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div className="form-group">
                <button 
                  type="submit" 
                  className="btn-primary w-full flex justify-center py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating practice account...
                    </span>
                  ) : 'Create Veterinary Practice Account'}
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 