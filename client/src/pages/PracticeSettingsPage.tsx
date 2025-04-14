import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FaUpload, 
  FaBuilding, 
  FaPhone, 
  FaEnvelope,
  FaPalette,
  FaSave,
  FaUndo 
} from 'react-icons/fa';
import { 
  getPracticeDetails, 
  updatePracticeSettings, 
  uploadPracticeLogo,
  IPractice
} from '../services/practiceService';

// Validation schema
const PracticeSettingsSchema = Yup.object().shape({
  name: Yup.string()
    .required('Practice name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot be longer than 100 characters'),
  address: Yup.string()
    .max(200, 'Address cannot be longer than 200 characters'),
  phone: Yup.string()
    .max(20, 'Phone number cannot be longer than 20 characters'),
  email: Yup.string()
    .email('Invalid email address')
    .max(100, 'Email cannot be longer than 100 characters'),
});

const PracticeSettingsPage: React.FC = () => {
  const [practice, setPractice] = useState<IPractice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [brandingColors, setBrandingColors] = useState<{
    primary: string;
    secondary: string;
    accent: string;
  }>({
    primary: '#4F46E5', // Default Indigo
    secondary: '#10B981', // Default Emerald
    accent: '#F59E0B', // Default Amber
  });

  useEffect(() => {
    const fetchPracticeDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPracticeDetails();
        setPractice(data);
        setLogoPreview(data.logo || null);
        
        // If practice has custom branding, set the color values
        if (data.customBranding && typeof data.customBranding === 'object') {
          setBrandingColors({
            primary: data.customBranding.primary || brandingColors.primary,
            secondary: data.customBranding.secondary || brandingColors.secondary,
            accent: data.customBranding.accent || brandingColors.accent,
          });
        }
      } catch (err: any) {
        console.error('Error fetching practice details:', err);
        setError(err.response?.data?.message || 'Failed to load practice details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPracticeDetails();
  }, []);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      try {
        setUploadingLogo(true);
        setError(null);
        const logoUrl = await uploadPracticeLogo(file);
        
        // Update practice state with new logo URL
        if (practice) {
          setPractice({
            ...practice,
            logo: logoUrl
          });
        }
        
        setSuccessMessage('Logo uploaded successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        console.error('Error uploading logo:', err);
        setError(err.response?.data?.message || 'Failed to upload logo');
        // Reset preview to previous value
        setLogoPreview(practice?.logo || null);
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    setBrandingColors((prev) => ({
      ...prev,
      [colorType]: value
    }));
  };

  const handleBrandingSubmit = async () => {
    if (!practice) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedPractice = await updatePracticeSettings({
        customBranding: brandingColors
      });
      
      setPractice(updatedPractice);
      setSuccessMessage('Branding colors updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating branding:', err);
      setError(err.response?.data?.message || 'Failed to update branding colors');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (isLoading && !practice) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Practice Settings</h1>
        <p className="text-gray-600">Manage your veterinary practice information and preferences</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Practice Info Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Practice Information</h2>
            
            {practice && (
              <Formik
                initialValues={{
                  name: practice.name || '',
                  address: practice.address || '',
                  phone: practice.phone || '',
                  email: practice.email || '',
                }}
                validationSchema={PracticeSettingsSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    setError(null);
                    const updatedPractice = await updatePracticeSettings(values);
                    setPractice(updatedPractice);
                    setSuccessMessage('Practice information updated successfully');
                    setTimeout(() => setSuccessMessage(null), 3000);
                  } catch (err: any) {
                    console.error('Error updating practice settings:', err);
                    setError(err.response?.data?.message || 'Failed to update practice information');
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ isSubmitting, resetForm }) => (
                  <Form className="space-y-4">
                    <div className="form-group">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        <FaBuilding className="inline mr-2" />
                        Practice Name
                      </label>
                      <Field
                        id="name"
                        name="name"
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="form-group">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <Field
                        as="textarea"
                        id="address"
                        name="address"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <ErrorMessage name="address" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          <FaPhone className="inline mr-2" />
                          Phone Number
                        </label>
                        <Field
                          id="phone"
                          name="phone"
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          <FaEnvelope className="inline mr-2" />
                          Contact Email
                        </label>
                        <Field
                          id="email"
                          name="email"
                          type="email"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => resetForm()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaUndo className="mr-2" /> Reset
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaSave className="mr-2" />
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            )}
          </div>
        </div>

        {/* Logo and Branding */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Practice Logo</h2>
            
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 border border-gray-300 rounded-md flex items-center justify-center mb-4 overflow-hidden bg-gray-50">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Practice Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <FaBuilding className="text-gray-400 text-4xl" />
                )}
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                accept="image/jpeg,image/png,image/gif,image/svg+xml"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={uploadingLogo}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaUpload className="mr-2" />
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              </button>
              
              <p className="text-xs text-gray-500 mt-2">
                Recommended size: 512x512 pixels (PNG, JPG, GIF, or SVG)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Branding Colors</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                  Primary Color
                </label>
                <div className="flex mt-1">
                  <input
                    type="color"
                    id="primaryColor"
                    value={brandingColors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="h-10 w-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingColors.primary.toUpperCase()}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="ml-2 flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">
                  Secondary Color
                </label>
                <div className="flex mt-1">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={brandingColors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="h-10 w-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingColors.secondary.toUpperCase()}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="ml-2 flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700">
                  Accent Color
                </label>
                <div className="flex mt-1">
                  <input
                    type="color"
                    id="accentColor"
                    value={brandingColors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="h-10 w-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandingColors.accent.toUpperCase()}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="ml-2 flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleBrandingSubmit}
                  disabled={isLoading}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaPalette className="mr-2" />
                  {isLoading ? 'Saving...' : 'Save Branding Colors'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeSettingsPage; 