import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Enum types from backend
enum MonitoringPlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

enum SymptomDataType {
  NUMERIC = 'NUMERIC',
  BOOLEAN = 'BOOLEAN',
  SCALE = 'SCALE',
  ENUMERATION = 'ENUMERATION',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

// Interfaces
interface MonitoringPlanFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: MonitoringPlanStatus;
  isTemplate: boolean;
  protocol: {
    frequency: {
      times: number;
      period: 'DAY' | 'WEEK' | 'MONTH';
    };
    duration: number; // in days
    reminderEnabled: boolean;
    shareableLink: boolean;
  };
}

interface SymptomTemplate {
  id?: string;
  name: string;
  description: string;
  category: string;
  dataType: SymptomDataType;
  units?: string;
  minValue?: number;
  maxValue?: number;
  options?: Record<string, any>;
  isNew?: boolean;
  modified?: boolean;
}

interface Patient {
  id: string;
  name: string;
  species: string;
  breed?: string;
}

const initialFormData: MonitoringPlanFormData = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  status: MonitoringPlanStatus.DRAFT,
  isTemplate: false,
  protocol: {
    frequency: {
      times: 1,
      period: 'DAY',
    },
    duration: 30,
    reminderEnabled: true,
    shareableLink: true,
  }
};

const MonitoringPlanFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState<MonitoringPlanFormData>(initialFormData);
  const [symptoms, setSymptoms] = useState<SymptomTemplate[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof MonitoringPlanFormData | string, string>>>({});
  const [shareableUrl, setShareableUrl] = useState<string>('');
  
  // Fetch monitoring plan data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchMonitoringPlan = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch monitoring plan details');
          }

          const planData = await response.json();
          
          // Format data for form
          setFormData({
            title: planData.title || '',
            description: planData.description || '',
            startDate: planData.startDate ? new Date(planData.startDate).toISOString().split('T')[0] : '',
            endDate: planData.endDate ? new Date(planData.endDate).toISOString().split('T')[0] : '',
            status: planData.status || MonitoringPlanStatus.DRAFT,
            isTemplate: planData.isTemplate || false,
            protocol: planData.protocol || initialFormData.protocol
          });
          
          // Fetch symptoms for this plan
          const symptomsResponse = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${id}/symptoms`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (symptomsResponse.ok) {
            const symptomsData = await symptomsResponse.json();
            setSymptoms(symptomsData);
          }
          
          // Fetch patients associated with this plan
          const patientsResponse = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${id}/patients`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (patientsResponse.ok) {
            const patientsData = await patientsResponse.json();
            setSelectedPatients(patientsData.map((p: any) => p.patientId));
          }
          
          // Check if shareable link exists
          if (planData.shareableLink) {
            setShareableUrl(planData.shareableLink);
          }
          
        } catch (err) {
          console.error(err);
          toast.error(err instanceof Error ? err.message : 'Failed to load monitoring plan data');
          navigate('/monitoring-plans');
        } finally {
          setLoading(false);
        }
      };

      fetchMonitoringPlan();
    }
  }, [id, isEditMode, navigate]);
  
  // Fetch all patients to select from
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/patients`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        }
      } catch (err) {
        console.error('Failed to fetch patients:', err);
      }
    };
    
    fetchPatients();
  }, []);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested protocol fields
    if (name.startsWith('protocol.')) {
      const protocolField = name.split('.')[1];
      if (protocolField === 'frequency.times' || protocolField === 'frequency.period') {
        const [, freqField] = protocolField.split('.');
        setFormData(prev => ({
          ...prev,
          protocol: {
            ...prev.protocol,
            frequency: {
              ...prev.protocol.frequency,
              [freqField]: freqField === 'times' ? parseInt(value) : value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          protocol: {
            ...prev.protocol,
            [protocolField]: protocolField === 'duration' ? parseInt(value) : value === 'true'
          }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle adding a new symptom template
  const addSymptomTemplate = () => {
    const newSymptom: SymptomTemplate = {
      name: '',
      description: '',
      category: '',
      dataType: SymptomDataType.SCALE,
      isNew: true
    };
    
    setSymptoms(prev => [...prev, newSymptom]);
  };
  
  // Handle updating symptom template fields
  const handleSymptomChange = (index: number, field: keyof SymptomTemplate, value: any) => {
    setSymptoms(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  
  // Handle removing a symptom template
  const removeSymptomTemplate = (index: number) => {
    setSymptoms(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle patient selection toggle
  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients(prev => {
      if (prev.includes(patientId)) {
        return prev.filter(id => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = 'End date cannot be before start date';
      }
    }
    
    // Validate all symptoms have at least a name
    symptoms.forEach((symptom, index) => {
      if (!symptom.name.trim()) {
        newErrors[`symptom[${index}].name`] = 'Symptom name is required';
      }
    });
    
    // Require at least one patient for non-template plans
    if (!formData.isTemplate && selectedPatients.length === 0) {
      newErrors.patients = 'At least one patient must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Generate a shareable link
  const generateShareableLink = async () => {
    if (!id) {
      toast.error('Please save the monitoring plan first to generate a shareable link.');
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate shareable link');
      }
      
      const data = await response.json();
      setShareableUrl(data.shareableLink);
      toast.success('Shareable link generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to generate shareable link');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      setSaving(true);
      
      const url = isEditMode 
        ? `${import.meta.env.VITE_API_URL}/monitoring-plans/${id}`
        : `${import.meta.env.VITE_API_URL}/monitoring-plans`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      // Create/update monitoring plan
      const planResponse = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!planResponse.ok) {
        const errorData = await planResponse.json();
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} monitoring plan`);
      }
      
      const planData = await planResponse.json();
      const planId = planData.id || id;
      
      // Create/update symptoms
      for (const symptom of symptoms) {
        // Skip existing symptoms that weren't modified
        if (!symptom.isNew && !symptom.modified) continue;
        
        const symptomUrl = symptom.id 
          ? `${import.meta.env.VITE_API_URL}/monitoring-plans/${planId}/symptoms/${symptom.id}`
          : `${import.meta.env.VITE_API_URL}/monitoring-plans/${planId}/symptoms`;
        
        const symptomMethod = symptom.id ? 'PUT' : 'POST';
        
        // Remove UI-specific fields before sending to API
        const { isNew, modified, ...symptomData } = symptom;
        
        await fetch(symptomUrl, {
          method: symptomMethod,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(symptomData)
        });
      }
      
      // Update patient assignments
      if (!formData.isTemplate) {
        await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${planId}/patients`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ patientIds: selectedPatients })
        });
      }
      
      // Generate shareable link if requested and not already existing
      if (formData.protocol.shareableLink && !shareableUrl) {
        await generateShareableLink();
      }
      
      toast.success(`Monitoring plan ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate(`/monitoring-plans/${planId}`);
      
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} monitoring plan`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Monitoring Plan' : 'Create New Monitoring Plan'}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/monitoring-plans')}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              Provide the basic details for the monitoring plan.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.title ? 'border-red-500' : ''
                }`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.endDate ? 'border-red-500' : ''
                  }`}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {Object.values(MonitoringPlanStatus).map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center h-full pt-6">
                <input
                  type="checkbox"
                  name="isTemplate"
                  id="isTemplate"
                  checked={formData.isTemplate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isTemplate: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isTemplate" className="ml-2 block text-sm text-gray-700">
                  Save as template
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Monitoring Settings Section */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Monitoring Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Define how often symptoms should be monitored and for how long.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="protocol.frequency.times" className="block text-sm font-medium text-gray-700">
                  Frequency
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="number"
                    name="protocol.frequency.times"
                    id="protocol.frequency.times"
                    min={1}
                    value={formData.protocol.frequency.times}
                    onChange={handleChange}
                    className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <select
                    name="protocol.frequency.period"
                    value={formData.protocol.frequency.period}
                    onChange={handleChange}
                    className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="DAY">per day</option>
                    <option value="WEEK">per week</option>
                    <option value="MONTH">per month</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="protocol.duration" className="block text-sm font-medium text-gray-700">
                  Duration (days)
                </label>
                <input
                  type="number"
                  name="protocol.duration"
                  id="protocol.duration"
                  min={1}
                  value={formData.protocol.duration}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="protocol.reminderEnabled"
                  id="protocol.reminderEnabled"
                  checked={formData.protocol.reminderEnabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    protocol: { ...prev.protocol, reminderEnabled: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="protocol.reminderEnabled" className="ml-2 block text-sm text-gray-700">
                  Enable reminders for symptom logging
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="protocol.shareableLink"
                  id="protocol.shareableLink"
                  checked={formData.protocol.shareableLink}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    protocol: { ...prev.protocol, shareableLink: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="protocol.shareableLink" className="ml-2 block text-sm text-gray-700">
                  Create shareable link for this monitoring plan
                </label>
              </div>
              
              {shareableUrl && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Shareable Link:</p>
                  <div className="flex mt-1">
                    <input
                      type="text"
                      readOnly
                      value={shareableUrl}
                      className="block w-full rounded-l-md border-gray-300 text-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(shareableUrl);
                        toast.success('Link copied to clipboard!');
                      }}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Symptoms Section */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Symptoms to Monitor</h3>
              <p className="mt-1 text-sm text-gray-500">
                Define the symptoms that will be tracked in this monitoring plan.
              </p>
            </div>
            <button
              type="button"
              onClick={addSymptomTemplate}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <FaPlus className="mr-1" /> Add Symptom
            </button>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-4">
            {symptoms.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No symptoms added yet. Click "Add Symptom" to get started.</p>
              </div>
            ) : (
              symptoms.map((symptom, index) => (
                <div key={index} className="border border-gray-200 rounded p-4 relative">
                  <button
                    type="button"
                    onClick={() => removeSymptomTemplate(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`symptom-${index}-name`} className="block text-sm font-medium text-gray-700">
                        Symptom Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id={`symptom-${index}-name`}
                        value={symptom.name}
                        onChange={(e) => handleSymptomChange(index, 'name', e.target.value)}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors[`symptom[${index}].name`] ? 'border-red-500' : ''
                        }`}
                      />
                      {errors[`symptom[${index}].name`] && (
                        <p className="mt-1 text-sm text-red-500">{errors[`symptom[${index}].name`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor={`symptom-${index}-category`} className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <input
                        type="text"
                        id={`symptom-${index}-category`}
                        value={symptom.category}
                        onChange={(e) => handleSymptomChange(index, 'category', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor={`symptom-${index}-description`} className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id={`symptom-${index}-description`}
                      value={symptom.description}
                      onChange={(e) => handleSymptomChange(index, 'description', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label htmlFor={`symptom-${index}-dataType`} className="block text-sm font-medium text-gray-700">
                        Data Type
                      </label>
                      <select
                        id={`symptom-${index}-dataType`}
                        value={symptom.dataType}
                        onChange={(e) => handleSymptomChange(index, 'dataType', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        {Object.values(SymptomDataType).map(type => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor={`symptom-${index}-units`} className="block text-sm font-medium text-gray-700">
                        Units (if applicable)
                      </label>
                      <input
                        type="text"
                        id={`symptom-${index}-units`}
                        value={symptom.units || ''}
                        onChange={(e) => handleSymptomChange(index, 'units', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  {(symptom.dataType === SymptomDataType.NUMERIC || symptom.dataType === SymptomDataType.SCALE) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor={`symptom-${index}-minValue`} className="block text-sm font-medium text-gray-700">
                          Minimum Value
                        </label>
                        <input
                          type="number"
                          id={`symptom-${index}-minValue`}
                          value={symptom.minValue || ''}
                          onChange={(e) => handleSymptomChange(index, 'minValue', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`symptom-${index}-maxValue`} className="block text-sm font-medium text-gray-700">
                          Maximum Value
                        </label>
                        <input
                          type="number"
                          id={`symptom-${index}-maxValue`}
                          value={symptom.maxValue || ''}
                          onChange={(e) => handleSymptomChange(index, 'maxValue', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Patient Selection Section (only for non-templates) */}
        {!formData.isTemplate && (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Selected Patients</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose which patients will be enrolled in this monitoring plan.
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {errors.patients && <p className="mb-2 text-sm text-red-500">{errors.patients}</p>}
              
              {patients.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No patients available. Create patients before adding them to a monitoring plan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patients.map(patient => (
                    <div key={patient.id} className="flex items-center space-x-3 border rounded p-3">
                      <input
                        type="checkbox"
                        id={`patient-${patient.id}`}
                        checked={selectedPatients.includes(patient.id)}
                        onChange={() => togglePatientSelection(patient.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`patient-${patient.id}`} className="block text-sm font-medium text-gray-700">
                        {patient.name}
                        <span className="text-gray-500 text-xs block">
                          {patient.species}{patient.breed ? ` - ${patient.breed}` : ''}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/monitoring-plans')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                {isEditMode ? 'Update Monitoring Plan' : 'Create Monitoring Plan'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MonitoringPlanFormPage; 