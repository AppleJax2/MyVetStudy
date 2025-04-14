import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getPatientById, 
  createPatient, 
  updatePatient, 
  Patient 
} from '../../services/patientService';
import toast from 'react-hot-toast';

const initialState: Patient = {
  name: '',
  species: '',
  breed: '',
  gender: '',
  color: '',
  birthDate: '',
  microchipId: '',
  status: 'Active',
  notes: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerAddress: '',
};

const PatientForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<Patient>(initialState);
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchPatient = async () => {
      if (id) {
        try {
          const data = await getPatientById(id);
          // Format date to YYYY-MM-DD for date input
          if (data.birthDate) {
            data.birthDate = new Date(data.birthDate).toISOString().split('T')[0];
          }
          setPatient(data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching patient:', error);
          toast.error('Failed to load patient details');
          navigate('/patients');
        }
      }
    };

    if (isEditMode) {
      fetchPatient();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode && id) {
        await updatePatient(id, patient);
        toast.success('Patient updated successfully');
      } else {
        await createPatient(patient);
        toast.success('Patient created successfully');
      }
      navigate('/patients');
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error(isEditMode ? 'Failed to update patient' : 'Failed to create patient');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading patient details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Patient' : 'Add New Patient'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={patient.name}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Species *
              </label>
              <select
                name="species"
                value={patient.species}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              >
                <option value="">Select species</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Reptile">Reptile</option>
                <option value="Small Mammal">Small Mammal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Breed
              </label>
              <input
                type="text"
                name="breed"
                value={patient.breed}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={patient.gender}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={patient.color}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                name="birthDate"
                value={patient.birthDate}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Microchip ID
              </label>
              <input
                type="text"
                name="microchipId"
                value={patient.microchipId}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={patient.status}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={patient.notes}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Name *
              </label>
              <input
                type="text"
                name="ownerName"
                value={patient.ownerName}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Email
              </label>
              <input
                type="email"
                name="ownerEmail"
                value={patient.ownerEmail}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Phone *
              </label>
              <input
                type="tel"
                name="ownerPhone"
                value={patient.ownerPhone}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Address
              </label>
              <input
                type="text"
                name="ownerAddress"
                value={patient.ownerAddress}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="px-4 py-2 border rounded hover:bg-gray-100"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={submitting}
          >
            {submitting 
              ? (isEditMode ? 'Updating...' : 'Creating...') 
              : (isEditMode ? 'Update Patient' : 'Create Patient')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm; 