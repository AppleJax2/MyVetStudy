import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface PatientFormData {
  name: string;
  species: string;
  breed: string;
  birthDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DECEASED';
  weight: string;
  microchipId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAddress: string;
  notes: string;
}

const initialFormData: PatientFormData = {
  name: '',
  species: '',
  breed: '',
  birthDate: '',
  status: 'ACTIVE',
  weight: '',
  microchipId: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerAddress: '',
  notes: ''
};

const PatientFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({});

  // Fetch patient data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchPatient = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch patient details');
          }

          const patientData = await response.json();
          
          // Format data for form
          setFormData({
            name: patientData.name || '',
            species: patientData.species || '',
            breed: patientData.breed || '',
            birthDate: patientData.birthDate ? new Date(patientData.birthDate).toISOString().split('T')[0] : '',
            status: patientData.status || 'ACTIVE',
            weight: patientData.weight ? patientData.weight.toString() : '',
            microchipId: patientData.microchipId || '',
            ownerName: patientData.ownerName || '',
            ownerEmail: patientData.ownerEmail || '',
            ownerPhone: patientData.ownerPhone || '',
            ownerAddress: patientData.ownerAddress || '',
            notes: patientData.notes || ''
          });
          
        } catch (err) {
          console.error(err);
          toast.error(err instanceof Error ? err.message : 'Failed to load patient data');
          navigate('/patients');
        } finally {
          setLoading(false);
        }
      };

      fetchPatient();
    }
  }, [id, isEditMode, navigate]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof PatientFormData]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof PatientFormData];
        return newErrors;
      });
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PatientFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Patient name is required';
    }
    
    if (!formData.species.trim()) {
      newErrors.species = 'Species is required';
    }
    
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    
    if (formData.ownerEmail && !/^\S+@\S+\.\S+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Please enter a valid email';
    }
    
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const currentDate = new Date();
      if (birthDate > currentDate) {
        newErrors.birthDate = 'Birth date cannot be in the future';
      }
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
      
      // Format data for API
      const patientData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
      };
      
      const url = isEditMode 
        ? `${import.meta.env.VITE_API_URL}/patients/${id}`
        : `${import.meta.env.VITE_API_URL}/patients`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(patientData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} patient`);
      }
      
      toast.success(`Patient ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate('/patients');
      
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} patient`);
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
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Patient' : 'Register New Patient'}
        </h1>
        <Link
          to="/patients"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaArrowLeft className="mr-2" /> Back to Patients
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Information Section */}
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Patient Information</h2>
            </div>

            {/* Patient Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Species */}
            <div>
              <label htmlFor="species" className="block text-sm font-medium text-gray-700">
                Species <span className="text-red-500">*</span>
              </label>
              <select
                id="species"
                name="species"
                value={formData.species}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border ${
                  errors.species ? 'border-red-300' : 'border-gray-300'
                } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              >
                <option value="">Select Species</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Reptile">Reptile</option>
                <option value="Other">Other</option>
              </select>
              {errors.species && (
                <p className="mt-1 text-sm text-red-600">{errors.species}</p>
              )}
            </div>

            {/* Breed */}
            <div>
              <label htmlFor="breed" className="block text-sm font-medium text-gray-700">
                Breed
              </label>
              <input
                type="text"
                id="breed"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                Birth Date
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full rounded-md border ${
                  errors.birthDate ? 'border-red-300' : 'border-gray-300'
                } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.birthDate && (
                <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Microchip ID */}
            <div>
              <label htmlFor="microchipId" className="block text-sm font-medium text-gray-700">
                Microchip ID
              </label>
              <input
                type="text"
                id="microchipId"
                name="microchipId"
                value={formData.microchipId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="DECEASED">Deceased</option>
              </select>
            </div>

            {/* Owner Information Section */}
            <div className="col-span-1 md:col-span-2 mt-4">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Owner Information</h2>
            </div>

            {/* Owner Name */}
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
                Owner Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border ${
                  errors.ownerName ? 'border-red-300' : 'border-gray-300'
                } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.ownerName && (
                <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>
              )}
            </div>

            {/* Owner Email */}
            <div>
              <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700">
                Owner Email
              </label>
              <input
                type="email"
                id="ownerEmail"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border ${
                  errors.ownerEmail ? 'border-red-300' : 'border-gray-300'
                } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.ownerEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.ownerEmail}</p>
              )}
            </div>

            {/* Owner Phone */}
            <div>
              <label htmlFor="ownerPhone" className="block text-sm font-medium text-gray-700">
                Owner Phone
              </label>
              <input
                type="tel"
                id="ownerPhone"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Owner Address */}
            <div>
              <label htmlFor="ownerAddress" className="block text-sm font-medium text-gray-700">
                Owner Address
              </label>
              <input
                type="text"
                id="ownerAddress"
                name="ownerAddress"
                value={formData.ownerAddress}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Notes */}
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <Link
              to="/patients"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaTimes className="mr-2" /> Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave className="mr-2" />
              {saving ? (
                <>
                  <span className="mr-2">Saving...</span>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                </>
              ) : (
                `${isEditMode ? 'Update' : 'Create'} Patient`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientFormPage; 