import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Type for a study
interface Study {
  id: string;
  title: string;
  description: string;
}

// Type for observation/symptom form
interface SymptomObservation {
  id?: string;
  studyId: string;
  date: string;
  painLevel: number;
  mobility: number;
  appetite: number;
  medication: boolean;
  medicationNotes?: string;
  generalNotes?: string;
  images?: File[];
}

// Validation schema
const SymptomSchema = Yup.object().shape({
  date: Yup.date()
    .required('Date is required')
    .max(new Date(), 'Date cannot be in the future'),
  painLevel: Yup.number()
    .required('Pain level assessment is required')
    .min(0, 'Must be between 0-10')
    .max(10, 'Must be between 0-10'),
  mobility: Yup.number()
    .required('Mobility assessment is required')
    .min(0, 'Must be between 0-10')
    .max(10, 'Must be between 0-10'),
  appetite: Yup.number()
    .required('Appetite assessment is required')
    .min(0, 'Must be between 0-10')
    .max(10, 'Must be between 0-10'),
  medication: Yup.boolean(),
  medicationNotes: Yup.string()
    .when('medication', {
      is: true,
      then: (schema) => schema.required('Please provide medication details')
    }),
  generalNotes: Yup.string()
    .max(1000, 'Notes cannot exceed 1000 characters'),
});

const SymptomsPage: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const navigate = useNavigate();
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    // Mock API call to fetch study details
    const fetchStudy = async () => {
      try {
        setLoading(true);
        
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data for study
        if (studyId === 'study-1') {
          setStudy({
            id: 'study-1',
            title: 'Canine Arthritis Treatment Efficacy',
            description: 'Evaluating new treatments for canine arthritis in medium to large breeds.'
          });
        } else if (studyId === 'study-2') {
          setStudy({
            id: 'study-2',
            title: 'Feline Nutrition Impact on Dental Health',
            description: 'Investigating the relationship between diet and dental health in domestic cats.'
          });
        } else if (studyId === 'study-3') {
          setStudy({
            id: 'study-3',
            title: 'Equine Exercise Recovery Methods',
            description: 'Comparing different recovery protocols for performance horses after intensive exercise.'
          });
        } else {
          setError('Study not found');
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load study data');
        setLoading(false);
      }
    };

    fetchStudy();
  }, [studyId]);

  const handleSubmit = async (values: SymptomObservation) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Add studyId to values
      values.studyId = studyId || '';
      
      // In a real app, this would be an API call
      console.log('Submitting observation:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setSubmitting(false);
      
      // Reset form after 3 seconds and redirect back to study
      setTimeout(() => {
        navigate(`/studies/${studyId}`);
      }, 3000);
      
    } catch (err) {
      setError('Failed to submit observation. Please try again.');
      setSubmitting(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, setFieldValue: (field: string, value: any) => void) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setFieldValue('images', fileArray);
    
    // Create preview URLs
    const newImageUrls: string[] = [];
    fileArray.forEach(file => {
      newImageUrls.push(URL.createObjectURL(file));
    });
    
    setImagePreviewUrls(newImageUrls);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error || 'Study not found'}</span>
        <div className="mt-4">
          <Link to="/studies" className="btn-primary">
            Back to Studies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <Link to="/studies" className="hover:text-blue-600">Studies</Link>
          <span>›</span>
          <Link to={`/studies/${studyId}`} className="hover:text-blue-600">{study.title}</Link>
          <span>›</span>
          <span>Record Symptoms</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Record Symptoms & Observations</h1>
        <p className="text-gray-600">Study: {study.title}</p>
      </div>

      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> Your observation has been recorded. Redirecting...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <Formik
            initialValues={{
              studyId: studyId || '',
              date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
              painLevel: 5,
              mobility: 5,
              appetite: 5,
              medication: false,
              medicationNotes: '',
              generalNotes: '',
              images: undefined
            }}
            validationSchema={SymptomSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form className="space-y-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="date" className="form-label">Observation Date</label>
                  <Field 
                    id="date" 
                    name="date" 
                    type="date" 
                    className="form-input"
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                  />
                  <ErrorMessage name="date" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Pain Level Assessment */}
                <div className="form-group">
                  <label htmlFor="painLevel" className="form-label">Pain Level (0-10)</label>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">No Pain (0)</span>
                    <Field 
                      id="painLevel" 
                      name="painLevel" 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="1"
                      className="w-full mx-2 accent-blue-600" 
                    />
                    <span className="text-gray-600 ml-2">Severe (10)</span>
                  </div>
                  <div className="text-center mt-1 font-medium">
                    Rating: {values.painLevel}
                  </div>
                  <ErrorMessage name="painLevel" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Mobility Assessment */}
                <div className="form-group">
                  <label htmlFor="mobility" className="form-label">Mobility Level (0-10)</label>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Poor (0)</span>
                    <Field 
                      id="mobility" 
                      name="mobility" 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="1"
                      className="w-full mx-2 accent-blue-600" 
                    />
                    <span className="text-gray-600 ml-2">Excellent (10)</span>
                  </div>
                  <div className="text-center mt-1 font-medium">
                    Rating: {values.mobility}
                  </div>
                  <ErrorMessage name="mobility" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Appetite Assessment */}
                <div className="form-group">
                  <label htmlFor="appetite" className="form-label">Appetite Level (0-10)</label>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Poor (0)</span>
                    <Field 
                      id="appetite" 
                      name="appetite" 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="1"
                      className="w-full mx-2 accent-blue-600" 
                    />
                    <span className="text-gray-600 ml-2">Excellent (10)</span>
                  </div>
                  <div className="text-center mt-1 font-medium">
                    Rating: {values.appetite}
                  </div>
                  <ErrorMessage name="appetite" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Medication */}
                <div className="form-group">
                  <div className="flex items-center">
                    <Field 
                      type="checkbox" 
                      id="medication" 
                      name="medication" 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="medication" className="ml-2 form-label">Medication Given</label>
                  </div>
                  
                  {values.medication && (
                    <div className="mt-3">
                      <label htmlFor="medicationNotes" className="form-label">Medication Details</label>
                      <Field 
                        as="textarea"
                        id="medicationNotes" 
                        name="medicationNotes" 
                        rows={3}
                        className="form-input" 
                        placeholder="Enter details about medication type, dosage, time, and any observations"
                      />
                      <ErrorMessage name="medicationNotes" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                  )}
                </div>

                {/* General Notes */}
                <div className="form-group">
                  <label htmlFor="generalNotes" className="form-label">General Notes (Optional)</label>
                  <Field 
                    as="textarea"
                    id="generalNotes" 
                    name="generalNotes" 
                    rows={4}
                    className="form-input" 
                    placeholder="Enter any other relevant observations or notes"
                  />
                  <ErrorMessage name="generalNotes" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label htmlFor="images" className="form-label">Upload Images (Optional)</label>
                  <input
                    id="images"
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => handleImageChange(event, setFieldValue)}
                    className="form-input py-2 px-3"
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload photos to document visual symptoms (max 5 images)</p>
                  
                  {/* Image Previews */}
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden h-24 bg-gray-100">
                          <img 
                            src={url} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                            onClick={() => {
                              const newUrls = [...imagePreviewUrls];
                              newUrls.splice(index, 1);
                              setImagePreviewUrls(newUrls);
                              
                              const newFiles = Array.from(values.images || []);
                              newFiles.splice(index, 1);
                              setFieldValue('images', newFiles.length > 0 ? newFiles : undefined);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Link 
                    to={`/studies/${studyId}`}
                    className="btn-secondary mr-3"
                  >
                    Cancel
                  </Link>
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
                        Submitting...
                      </span>
                    ) : 'Submit Observation'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </div>
  );
};

export default SymptomsPage; 