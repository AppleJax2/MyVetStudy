import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import SymptomForm, { SymptomTemplate, SymptomDataType } from '../components/monitoring/SymptomForm';
import FrequencySettings, { FrequencyProtocol } from '../components/monitoring-plan/FrequencySettings';
import ReminderSettings, { ReminderConfig } from '../components/monitoring-plan/ReminderSettings';
import ShareLink from '../components/monitoring-plan/ShareLink';

// Enum types from backend
enum MonitoringPlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

// Interfaces
interface MonitoringPlanFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: MonitoringPlanStatus;
  isTemplate: boolean;
  protocol: FrequencyProtocol & {
    reminderConfig?: ReminderConfig;
  };
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
    timeSlots: ['09:00'],
    weeklyDays: [],
    monthlyDays: [],
    reminderConfig: {
      enabled: true,
      methods: {
        email: true,
        push: true,
        sms: false
      },
      schedule: {
        sendBefore: 15,
        missedDataReminder: true,
        reminderFrequency: 'daily'
      }
    }
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

  // Handle frequency settings changes
  const handleFrequencyChange = (field: string, value: any) => {
    if (field.startsWith('frequency.')) {
      const freqField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        protocol: {
          ...prev.protocol,
          frequency: {
            ...prev.protocol.frequency,
            [freqField]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        protocol: {
          ...prev.protocol,
          [field]: value
        }
      }));
    }
  };

  // Handle reminder config changes
  const handleReminderConfigChange = (config: ReminderConfig) => {
    setFormData(prev => ({
      ...prev,
      protocol: {
        ...prev.protocol,
        reminderEnabled: config.enabled,
        reminderConfig: config
      }
    }));
  };

  // Handle shareable link generation success
  const handleShareableLinkGenerated = (url: string) => {
    setShareableUrl(url);
    
    // Update the protocol to reflect that a shareable link exists
    if (url) {
      setFormData(prev => ({
        ...prev,
        protocol: {
          ...prev.protocol,
          shareableLink: true
        }
      }));
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
    const newErrors: Partial<Record<keyof MonitoringPlanFormData | string, string>> = {};
    
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

    // Validate frequency times is at least 1
    if (formData.protocol.frequency.times < 1) {
      newErrors['frequency.times'] = 'Frequency must be at least 1';
    }

    // Validate duration is at least 1
    if (formData.protocol.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 day';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  // Generate a shareable link - this is now handled by the ShareLink component
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header and Actions */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Monitoring Plan' : 'Create New Monitoring Plan'}
          </h1>
          <div className="flex space-x-4">
            <Link 
              to="/monitoring-plans" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FaArrowLeft className="mr-2 -ml-1 h-5 w-5" />
              Back
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaSave className="mr-2 -ml-1 h-5 w-5" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        {/* Basic Information */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              Provide the basic details for this monitoring plan.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
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
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.endDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={MonitoringPlanStatus.DRAFT}>Draft</option>
                    <option value={MonitoringPlanStatus.ACTIVE}>Active</option>
                    <option value={MonitoringPlanStatus.PAUSED}>Paused</option>
                    <option value={MonitoringPlanStatus.COMPLETED}>Completed</option>
                    <option value={MonitoringPlanStatus.ARCHIVED}>Archived</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="isTemplate"
                  name="isTemplate"
                  type="checkbox"
                  checked={formData.isTemplate}
                  onChange={(e) => setFormData({ ...formData, isTemplate: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isTemplate" className="ml-2 block text-sm text-gray-700">
                  Save as template (for future monitoring plans)
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Frequency and Duration Settings using the new component */}
        <FrequencySettings 
          protocol={formData.protocol}
          onChange={handleFrequencyChange}
          errors={errors}
        />
        
        {/* Reminder Settings using the new component */}
        {formData.protocol.reminderEnabled && (
          <ReminderSettings 
            config={formData.protocol.reminderConfig || {
              enabled: true,
              methods: { email: true, push: true },
              schedule: {
                sendBefore: 15,
                missedDataReminder: true,
                reminderFrequency: 'daily'
              }
            }}
            onChange={handleReminderConfigChange}
            showSmsOption={false}
          />
        )}
        
        {/* Symptoms to Monitor section using the new SymptomForm component */}
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
                <SymptomForm 
                  key={index}
                  symptom={symptom}
                  index={index}
                  onChange={handleSymptomChange}
                  onRemove={removeSymptomTemplate}
                  errors={errors}
                />
              ))
            )}
          </div>
        </div>

        {/* Patient Selection Section (only for non-templates) */}
        {!formData.isTemplate && (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Select Patients</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose which patients will participate in this monitoring plan.
              </p>
              {errors.patients && (
                <p className="mt-1 text-sm text-red-500">{errors.patients}</p>
              )}
            </div>
            <div className="px-4 py-5 sm:p-6">
              {patients.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No patients available. Please add patients first.</p>
                  <Link to="/patients/new" className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    <FaPlus className="mr-1" /> Add Patient
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {patients.map((patient) => (
                    <div key={patient.id} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`patient-${patient.id}`}
                          type="checkbox"
                          checked={selectedPatients.includes(patient.id)}
                          onChange={() => togglePatientSelection(patient.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`patient-${patient.id}`} className="font-medium text-gray-700">
                          {patient.name}
                        </label>
                        <p className="text-gray-500">
                          {patient.species}{patient.breed ? ` (${patient.breed})` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Shareable Link Section - only show in edit mode after initial save */}
        {isEditMode && (
          <ShareLink 
            monitoringPlanId={id || ''}
            shareableUrl={shareableUrl} 
            onLinkGenerated={handleShareableLinkGenerated}
          />
        )}
      </form>
    </div>
  );
};

export default MonitoringPlanFormPage; 