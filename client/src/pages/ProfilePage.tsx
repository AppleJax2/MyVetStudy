import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Profile validation schema
const ProfileSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: Yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^\+?[0-9\s-()]+$/, 'Invalid phone number format'),
  practice: Yup.string(),
  profession: Yup.string()
    .required('Profession is required'),
  specialty: Yup.string(),
  bio: Yup.string().max(500, 'Bio cannot exceed 500 characters'),
  notificationsEmail: Yup.boolean(),
  notificationsSMS: Yup.boolean(),
  notificationsPush: Yup.boolean(),
});

// Password validation schema
const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  practice: string;
  profession: string;
  specialty: string;
  bio: string;
  notificationsEmail: boolean;
  notificationsSMS: boolean;
  notificationsPush: boolean;
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Mock user data - would be fetched from API in real app
  const initialUserProfile: UserProfile = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    practice: 'Pawsome Veterinary Clinic',
    profession: 'Veterinarian',
    specialty: 'Small Animals',
    bio: 'Practicing veterinarian with 10 years of experience specializing in small animal care. Passionate about improving animal health through research and evidence-based medicine.',
    notificationsEmail: true,
    notificationsSMS: false,
    notificationsPush: true,
  };

  const handleProfileSubmit = async (values: UserProfile, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    // In a real app, this would call an API to update profile
    console.log('Profile update:', values);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUpdateSuccess(true);
    setSubmitting(false);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setUpdateSuccess(false);
    }, 3000);
  };

  const handlePasswordSubmit = async (values: any, { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void, resetForm: () => void }) => {
    // In a real app, this would call an API to update password
    console.log('Password update:', values);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPasswordSuccess(true);
    setSubmitting(false);
    resetForm();
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setPasswordSuccess(false);
    }, 3000);
  };

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>
      
      {/* Profile Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'password'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Notification Settings
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Information</h2>
              
              {updateSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                  <span className="block sm:inline">Profile updated successfully!</span>
                </div>
              )}
              
              <Formik
                initialValues={initialUserProfile}
                validationSchema={ProfileSchema}
                onSubmit={handleProfileSubmit}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-group">
                        <label htmlFor="firstName" className="form-label">First Name</label>
                        <Field 
                          id="firstName" 
                          name="firstName" 
                          type="text" 
                          className="form-input" 
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
                        />
                        <ErrorMessage name="lastName" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <Field 
                          id="email" 
                          name="email" 
                          type="email" 
                          className="form-input" 
                        />
                        <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="phone" className="form-label">Phone Number</label>
                        <Field 
                          id="phone" 
                          name="phone" 
                          type="text" 
                          className="form-input" 
                        />
                        <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-group">
                        <label htmlFor="practice" className="form-label">Veterinary Practice</label>
                        <Field 
                          id="practice" 
                          name="practice" 
                          type="text" 
                          className="form-input" 
                        />
                        <ErrorMessage name="practice" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="profession" className="form-label">Profession</label>
                        <Field 
                          as="select"
                          id="profession" 
                          name="profession" 
                          className="form-input" 
                        >
                          <option value="">Select profession</option>
                          <option value="Veterinarian">Veterinarian</option>
                          <option value="Vet Technician">Vet Technician</option>
                          <option value="Practice Owner">Practice Owner</option>
                          <option value="Practice Manager">Practice Manager</option>
                          <option value="Student">Veterinary Student</option>
                          <option value="Researcher">Researcher</option>
                          <option value="Other">Other</option>
                        </Field>
                        <ErrorMessage name="profession" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="specialty" className="form-label">Specialty (Optional)</label>
                      <Field 
                        as="select"
                        id="specialty" 
                        name="specialty" 
                        className="form-input" 
                      >
                        <option value="">Select specialty (if applicable)</option>
                        <option value="Small Animals">Small Animals</option>
                        <option value="Large Animals">Large Animals</option>
                        <option value="Exotic Animals">Exotic Animals</option>
                        <option value="Equine">Equine</option>
                        <option value="Wildlife">Wildlife</option>
                        <option value="Behavior">Behavior</option>
                        <option value="Nutrition">Nutrition</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Dentistry">Dentistry</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Oncology">Oncology</option>
                        <option value="Other">Other</option>
                      </Field>
                      <ErrorMessage name="specialty" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="bio" className="form-label">Professional Bio (Optional)</label>
                      <Field 
                        as="textarea"
                        id="bio" 
                        name="bio" 
                        rows={4}
                        className="form-input" 
                      />
                      <ErrorMessage name="bio" component="div" className="text-red-500 text-sm mt-1" />
                      <div className="text-sm text-gray-500 mt-1">Brief description of your professional background and interests (500 characters max)</div>
                    </div>
                    
                    <div className="form-group">
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </span>
                        ) : 'Save Changes'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}
          
          {/* Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Change Password</h2>
              
              {passwordSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                  <span className="block sm:inline">Password updated successfully!</span>
                </div>
              )}
              
              <Formik
                initialValues={{
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                }}
                validationSchema={PasswordSchema}
                onSubmit={handlePasswordSubmit}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6 max-w-md">
                    <div className="form-group">
                      <label htmlFor="currentPassword" className="form-label">Current Password</label>
                      <Field 
                        id="currentPassword" 
                        name="currentPassword" 
                        type="password" 
                        className="form-input" 
                      />
                      <ErrorMessage name="currentPassword" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="newPassword" className="form-label">New Password</label>
                      <Field 
                        id="newPassword" 
                        name="newPassword" 
                        type="password" 
                        className="form-input" 
                      />
                      <ErrorMessage name="newPassword" component="div" className="text-red-500 text-sm mt-1" />
                      <div className="text-sm text-gray-500 mt-1">Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character</div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                      <Field 
                        id="confirmPassword" 
                        name="confirmPassword" 
                        type="password" 
                        className="form-input" 
                      />
                      <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    
                    <div className="form-group">
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </span>
                        ) : 'Change Password'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Preferences</h2>
              
              {updateSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                  <span className="block sm:inline">Notification preferences updated successfully!</span>
                </div>
              )}
              
              <Formik
                initialValues={{
                  ...initialUserProfile,
                  notificationsEmail: initialUserProfile.notificationsEmail,
                  notificationsSMS: initialUserProfile.notificationsSMS,
                  notificationsPush: initialUserProfile.notificationsPush,
                }}
                onSubmit={handleProfileSubmit}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div className="space-y-4">
                      <div className="form-group">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Receive notifications for:</h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Field 
                              type="checkbox" 
                              id="study-updates" 
                              name="studyUpdates" 
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                              defaultChecked
                            />
                            <label htmlFor="study-updates" className="ml-2 text-gray-700">Study updates and announcements</label>
                          </div>
                          
                          <div className="flex items-center">
                            <Field 
                              type="checkbox" 
                              id="observation-reminders" 
                              name="observationReminders" 
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                              defaultChecked
                            />
                            <label htmlFor="observation-reminders" className="ml-2 text-gray-700">Observation and data entry reminders</label>
                          </div>
                          
                          <div className="flex items-center">
                            <Field 
                              type="checkbox" 
                              id="new-studies" 
                              name="newStudies" 
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                              defaultChecked
                            />
                            <label htmlFor="new-studies" className="ml-2 text-gray-700">New studies matching your interests</label>
                          </div>
                          
                          <div className="flex items-center">
                            <Field 
                              type="checkbox" 
                              id="results-publication" 
                              name="resultsPublication" 
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                              defaultChecked
                            />
                            <label htmlFor="results-publication" className="ml-2 text-gray-700">Study results and publications</label>
                          </div>
                          
                          <div className="flex items-center">
                            <Field 
                              type="checkbox" 
                              id="platform-updates" 
                              name="platformUpdates" 
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                            />
                            <label htmlFor="platform-updates" className="ml-2 text-gray-700">Platform updates and news</label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Notification methods:</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <Field 
                              type="checkbox" 
                              id="notificationsEmail" 
                              name="notificationsEmail" 
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                            />
                            <label htmlFor="notificationsEmail" className="ml-2 text-gray-700">Email notifications</label>
                          </div>
                          
                          <div className="flex items-center">
                            <Field 
                              type="checkbox" 
                              id="notificationsSMS" 
                              name="notificationsSMS" 
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                            />
                            <label htmlFor="notificationsSMS" className="ml-2 text-gray-700">SMS text messages</label>
                            <span className="ml-2 text-sm text-gray-500">(Carrier charges may apply)</span>
                          </div>
                          
                          <div className="flex items-center">
                            <Field 
                              type="checkbox" 
                              id="notificationsPush" 
                              name="notificationsPush" 
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                            />
                            <label htmlFor="notificationsPush" className="ml-2 text-gray-700">Push notifications</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </span>
                        ) : 'Save Preferences'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 