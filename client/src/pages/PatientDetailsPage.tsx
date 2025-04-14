import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaEdit, FaArrowLeft, FaCalendarAlt, FaNotesMedical } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string;
  birthDate: string | null;
  sex: 'MALE' | 'FEMALE' | 'UNKNOWN';
  color: string | null;
  microchipNumber: string | null;
  weight: number | null;
  ownerName: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
  ownerAddress: string | null;
  notes: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DECEASED';
  createdAt: string;
  updatedAt: string;
}

const PatientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Patient not found');
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch patient details');
        }

        const data = await response.json();
        setPatient(data.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error(err instanceof Error ? err.message : 'Failed to fetch patient details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatientDetails();
    }
  }, [id]);

  // Format date to display in a readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate age based on birth date
  const calculateAge = (birthDateString: string | null) => {
    if (!birthDateString) return 'Unknown';
    
    const birthDate = new Date(birthDateString);
    const today = new Date();
    
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }
    
    if (years < 1) {
      // Calculate months for young animals
      const months = years * 12 + (today.getMonth() - birthDate.getMonth());
      return `${months} months`;
    }
    
    return `${years} years`;
  };

  // Get status color class based on patient status
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DECEASED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <h2 className="text-lg font-semibold">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/patients')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <h2 className="text-lg font-semibold">Patient Not Found</h2>
          <p>The requested patient could not be found.</p>
          <button 
            onClick={() => navigate('/patients')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with back button */}
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => navigate('/patients')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <div className="flex items-center mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(patient.status)}`}>
              {patient.status.charAt(0) + patient.status.slice(1).toLowerCase()}
            </span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-sm text-gray-500">{patient.species}</span>
            {patient.breed && (
              <>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-sm text-gray-500">{patient.breed}</span>
              </>
            )}
          </div>
        </div>
        <div className="ml-auto">
          <Link 
            to={`/patients/${patient.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaEdit className="mr-2" /> Edit Patient
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Patient Details Card */}
          <div className="md:col-span-2 border rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and attributes.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.name}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Species</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.species}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Breed</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.breed || 'Not specified'}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Birth Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(patient.birthDate)}
                    {patient.birthDate && (
                      <span className="ml-2 text-gray-500">({calculateAge(patient.birthDate)} old)</span>
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Sex</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {patient.sex === 'MALE' ? 'Male' : patient.sex === 'FEMALE' ? 'Female' : 'Unknown'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Color</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.color || 'Not specified'}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Weight</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {patient.weight ? `${patient.weight} kg` : 'Not specified'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Microchip Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.microchipNumber || 'Not specified'}</dd>
                </div>
                {patient.notes && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{patient.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Owner Information Card */}
          <div className="border rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Owner Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Contact details.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patient.ownerName}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {patient.ownerEmail ? (
                      <a href={`mailto:${patient.ownerEmail}`} className="text-blue-500 hover:underline">
                        {patient.ownerEmail}
                      </a>
                    ) : (
                      'Not specified'
                    )}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {patient.ownerPhone ? (
                      <a href={`tel:${patient.ownerPhone}`} className="text-blue-500 hover:underline">
                        {patient.ownerPhone}
                      </a>
                    ) : (
                      'Not specified'
                    )}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {patient.ownerAddress || 'Not specified'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="p-6 mt-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to={`/patients/${patient.id}/appointments/new`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaCalendarAlt className="mr-2" /> Schedule Appointment
            </Link>
            <Link
              to={`/patients/${patient.id}/medical-records/new`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaNotesMedical className="mr-2" /> Add Medical Record
            </Link>
          </div>
        </div>

        {/* Record History */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              <li className="px-6 py-4">
                <div className="flex items-center">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 truncate">Patient created</p>
                      <p className="mt-1 text-sm text-gray-500">
                        <time dateTime={patient.createdAt}>{formatDate(patient.createdAt)}</time>
                      </p>
                    </div>
                  </div>
                </div>
              </li>
              {patient.createdAt !== patient.updatedAt && (
                <li className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 truncate">Patient information updated</p>
                        <p className="mt-1 text-sm text-gray-500">
                          <time dateTime={patient.updatedAt}>{formatDate(patient.updatedAt)}</time>
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsPage; 