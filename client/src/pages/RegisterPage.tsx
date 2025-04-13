import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Registration validation schema
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

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleSubmit = async (values: any, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      setRegisterError(null);
      // TODO: Replace with actual API call
      console.log('Registration attempt:', values);
      
      // For demo purposes - simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (error) {
      setRegisterError('An error occurred during registration. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-12 fade-in">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Sign up for MyVetStudy</p>
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
            password: '',
            confirmPassword: '',
            termsAccepted: false
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

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
                <label htmlFor="password" className="form-label">Password</label>
                <Field 
                  id="password" 
                  name="password" 
                  type="password" 
                  className="form-input" 
                />
                <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
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

              <div className="form-group">
                <label className="flex items-center">
                  <Field 
                    type="checkbox" 
                    name="termsAccepted" 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to the <Link to="/terms" className="text-blue-600 hover:text-blue-800">Terms and Conditions</Link>
                  </span>
                </label>
                <ErrorMessage name="termsAccepted" component="div" className="text-red-500 text-sm mt-1" />
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
                      Creating account...
                    </span>
                  ) : 'Create Account'}
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