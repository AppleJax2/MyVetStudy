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

interface MonitoringPlanSymptom {
  id: string;
  name: string;
  description: string;
  category: string;
  // ... other fields ...
}

const SymptomsPage: React.FC = () => {
  const { id, studyId } = useParams<{ id?: string, studyId?: string }>();
  const monitoringPlanId = id || studyId; // Support both new and old route params
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState<MonitoringPlanSymptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [monitoringPlanTitle, setMonitoringPlanTitle] = useState('');

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        // Fetch monitoring plan details first to get the title
        const planResponse = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${monitoringPlanId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!planResponse.ok) {
          throw new Error('Failed to fetch monitoring plan details');
        }

        const planData = await planResponse.json();
        setMonitoringPlanTitle(planData.title);

        // Fetch symptoms for this monitoring plan
        const symptomsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/monitoring-plans/${monitoringPlanId}/symptoms`, 
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!symptomsResponse.ok) {
          throw new Error('Failed to fetch symptoms');
        }

        const symptomsData = await symptomsResponse.json();
        setSymptoms(symptomsData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    if (monitoringPlanId) {
      fetchSymptoms();
    } else {
      setError('Monitoring plan ID is missing');
      setLoading(false);
    }
  }, [monitoringPlanId]);

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
        navigate(`/monitoring-plans/${monitoringPlanId}`);
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
    return <div className="loading">Loading symptoms...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="breadcrumbs">
          <Link to="/monitoring-plans">Monitoring Plans</Link> / 
          <Link to={`/monitoring-plans/${monitoringPlanId}`}>{monitoringPlanTitle}</Link> / 
          Symptoms
        </div>
        <h1>Symptoms for {monitoringPlanTitle}</h1>
        <Link to={`/monitoring-plans/${monitoringPlanId}/symptoms/new`} className="btn btn-primary">
          Add New Symptom
        </Link>
      </div>

      <div className="symptoms-grid">
        {symptoms.length === 0 ? (
          <div className="empty-state">
            <p>No symptoms have been added to this monitoring plan yet.</p>
            <Link to={`/monitoring-plans/${monitoringPlanId}/symptoms/new`} className="btn btn-secondary">
              Add First Symptom
            </Link>
          </div>
        ) : (
          symptoms.map((symptom) => (
            <div key={symptom.id} className="symptom-card">
              <h2 className="symptom-title">{symptom.name}</h2>
              <p className="symptom-description">
                {symptom.description || 'No description provided'}
              </p>
              {symptom.category && (
                <div className="symptom-category">
                  Category: <span>{symptom.category}</span>
                </div>
              )}
              <div className="symptom-actions">
                <Link 
                  to={`/monitoring-plans/${monitoringPlanId}/symptoms/${symptom.id}`} 
                  className="btn btn-view"
                >
                  View Details
                </Link>
                <Link 
                  to={`/monitoring-plans/${monitoringPlanId}/symptoms/${symptom.id}/edit`} 
                  className="btn btn-edit"
                >
                  Edit
                </Link>
                {/* Add other action buttons as needed */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SymptomsPage; 