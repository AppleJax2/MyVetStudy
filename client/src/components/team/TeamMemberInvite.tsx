import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { UserRole } from '../../types/auth';
import api from '../../services/api';

interface TeamMemberInviteProps {
  onInviteSent: () => void;
  onCancel: () => void;
}

interface InviteFormValues {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  message: string;
}

const InviteSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  role: Yup.string()
    .required('Role is required'),
  message: Yup.string()
    .max(500, 'Message should be less than 500 characters')
});

// Map of roles that can be assigned to team members
const assignableRoles = [
  { value: UserRole.VETERINARIAN, label: 'Veterinarian' },
  { value: UserRole.VET_TECHNICIAN, label: 'Vet Technician' },
  { value: UserRole.VET_ASSISTANT, label: 'Vet Assistant' },
  { value: UserRole.RECEPTIONIST, label: 'Receptionist' }
];

const TeamMemberInvite: React.FC<TeamMemberInviteProps> = ({ onInviteSent, onCancel }) => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: InviteFormValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      setError(null);
      await api.post('/team/invite', values);
      onInviteSent();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred while sending the invitation. Please try again.';
      setError(errorMessage);
      console.error('Invitation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Invite Team Member</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Invite a new colleague to join your veterinary practice
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="px-4 py-5 sm:p-6">
        <Formik
          initialValues={{
            email: '',
            firstName: '',
            lastName: '',
            role: '' as UserRole,
            message: 'I\'d like to invite you to join our veterinary practice on MyVetStudy. Please sign up using this invitation.'
          }}
          validationSchema={InviteSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <Field
                    id="firstName"
                    name="firstName"
                    type="text"
                    className="form-input"
                    placeholder="Jane"
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
                    placeholder="Smith"
                  />
                  <ErrorMessage name="lastName" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="jane.smith@example.com"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="form-group">
                  <label htmlFor="role" className="form-label">Role</label>
                  <Field
                    as="select"
                    id="role"
                    name="role"
                    className="form-select"
                  >
                    <option value="">Select Role</option>
                    {assignableRoles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="role" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">Invitation Message (Optional)</label>
                <Field
                  as="textarea"
                  id="message"
                  name="message"
                  rows={3}
                  className="form-textarea"
                />
                <ErrorMessage name="message" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default TeamMemberInvite; 