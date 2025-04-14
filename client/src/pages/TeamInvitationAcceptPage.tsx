import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FaUserPlus, FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';

// Define interface for invitation details
interface InvitationDetails {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  practiceId: string;
  practiceName: string;
  inviterName: string;
  expiresAt: string;
}

// Password validation schema
const AcceptInvitationSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  agreeToTerms: Yup.boolean()
    .oneOf([true], 'You must agree to the terms and conditions')
    .required('You must agree to the terms and conditions'),
});

const TeamInvitationAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);

  useEffect(() => {
    const verifyInvitation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call API to verify invitation token
        const response = await api.get(`/team/invitations/verify/${token}`);
        setInvitation(response.data.invitation);
      } catch (err: any) {
        console.error('Error verifying invitation:', err);
        setError(
          err.response?.data?.message || 
          'This invitation link is invalid or has expired. Please contact your practice administrator.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyInvitation();
    } else {
      setError('Invalid invitation link. No token provided.');
      setLoading(false);
    }
  }, [token]);

  const handleAcceptInvitation = async (values: { password: string }) => {
    try {
      setLoading(true);
      setError(null);

      // Call API to accept invitation
      await api.post('/team/invitations/accept', {
        token,
        password: values.password,
      });

      setSuccess(true);
      // Redirect to login page after a delay
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Invitation accepted successfully. You can now log in with your email and password.' 
          } 
        });
      }, 3000);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(
        err.response?.data?.message || 
        'Failed to accept invitation. Please try again or contact your practice administrator.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="rounded-full bg-red-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-6">
            <FaTimes className="text-red-600 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Invitation Error</h1>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <Link 
            to="/login" 
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaArrowLeft className="mr-2" /> Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="rounded-full bg-green-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-6">
            <FaCheck className="text-green-600 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Invitation Accepted!</h1>
          <p className="text-gray-600 text-center mb-6">
            Your account has been created successfully. You will be redirected to the login page in a moment.
          </p>
          <Link 
            to="/login" 
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaArrowLeft className="mr-2" /> Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-8">
          <div className="rounded-full bg-indigo-100 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <FaUserPlus className="text-indigo-600 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Join {invitation?.practiceName}</h1>
          <p className="text-gray-500">Complete your account setup</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Invitation Details</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">Name:</dt>
            <dd className="text-gray-900 font-medium">{invitation?.firstName} {invitation?.lastName}</dd>
            
            <dt className="text-gray-500">Email:</dt>
            <dd className="text-gray-900 font-medium">{invitation?.email}</dd>
            
            <dt className="text-gray-500">Role:</dt>
            <dd className="text-gray-900 font-medium">{invitation?.role?.replace('_', ' ')}</dd>
            
            <dt className="text-gray-500">Invited by:</dt>
            <dd className="text-gray-900 font-medium">{invitation?.inviterName}</dd>
          </dl>
        </div>

        <Formik
          initialValues={{
            password: '',
            confirmPassword: '',
            agreeToTerms: false,
          }}
          validationSchema={AcceptInvitationSchema}
          onSubmit={(values) => handleAcceptInvitation(values)}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Create Password
                </label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.password && touched.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                <ErrorMessage
                  name="password"
                  component="p"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Field
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.confirmPassword && touched.confirmPassword
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="p"
                  className="mt-1 text-sm text-red-600"
                />
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <Field
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                    I agree to the{' '}
                    <a href="#" className="text-indigo-600 hover:text-indigo-500">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-indigo-600 hover:text-indigo-500">
                      Privacy Policy
                    </a>
                  </label>
                  <ErrorMessage
                    name="agreeToTerms"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner /> Processing...
                    </>
                  ) : (
                    <>Accept Invitation & Create Account</>
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default TeamInvitationAcceptPage; 