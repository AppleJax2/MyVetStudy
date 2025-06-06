import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaArrowLeft, FaArchive, FaTrash, FaClipboardList, FaNotesMedical } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import HealthHistoryTab from '../components/health/HealthHistoryTab';

// Extended Patient interface with monitoring plan enrollments
interface Patient {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  ownerName: string;
  ownerEmail?: string;
  ownerPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  monitoringPlans?: MonitoringPlanPatient[];
}

interface MonitoringPlanPatient {
  id: string;
  monitoringPlanId: string;
  patientId: string;
  enrollmentDate: string;
  exitDate?: string;
  isActive: boolean;
  monitoringPlan: {
    id: string;
    title: string;
    status: string;
    startDate?: string;
    endDate?: string;
  };
}

const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch patient data');
        }

        const data = await response.json();
        setPatient(data.data.patient);
        
        // If we have active monitoring plans, set the first one as active tab
        if (data.data.patient.monitoringPlans && 
            data.data.patient.monitoringPlans.length > 0 && 
            data.data.patient.monitoringPlans.some((plan: MonitoringPlanPatient) => plan.isActive)) {
          // Set the first active plan as the default active tab
          const firstActivePlan = data.data.patient.monitoringPlans.find(
            (plan: MonitoringPlanPatient) => plan.isActive
          );
          if (firstActivePlan) {
            setActiveTab(firstActivePlan.id);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast.error('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete patient');
      }

      toast.success('Patient deleted successfully');
      navigate('/patients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to delete patient');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleArchive = async () => {
    if (!patient) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...patient,
          isActive: !patient.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${patient.isActive ? 'archive' : 'restore'} patient`);
      }

      const data = await response.json();
      setPatient(data.data.patient);
      toast.success(`Patient ${patient.isActive ? 'archived' : 'restored'} successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error(`Failed to ${patient.isActive ? 'archive' : 'restore'} patient`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error || 'Patient not found'}</p>
          <Link to="/patients" className="text-red-700 underline mt-2 inline-block">
            Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  const renderStatusBadge = () => {
    if (patient.isActive) {
      return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Active</span>;
    }
    return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">Archived</span>;
  };

  const hasActiveMonitoringPlans = patient.monitoringPlans && 
    patient.monitoringPlans.some(plan => plan.isActive);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Link
            to="/patients"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <FaArrowLeft /> Back to Patients
          </Link>
        </div>
        
        <div className="flex gap-2">
          <Link
            to={`/patients/${id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaEdit className="mr-2" /> Edit
          </Link>
          
          <button
            onClick={handleArchive}
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
          >
            <FaArchive className="mr-2" /> {patient.isActive ? 'Archive' : 'Restore'}
          </button>
          
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`inline-flex items-center px-4 py-2 ${
              deleteConfirm ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white rounded-md transition-colors`}
          >
            <FaTrash className="mr-2" /> {deleteConfirm ? 'Confirm Delete' : 'Delete'}
          </button>
          
          <Link
            to={`/monitoring-plans/create?patientId=${id}`}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <FaClipboardList className="mr-2" /> Create Plan
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{patient.name}</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <span>{patient.species}</span>
                {patient.breed && (
                  <>
                    <span>•</span>
                    <span>{patient.breed}</span>
                  </>
                )}
                {patient.sex && (
                  <>
                    <span>•</span>
                    <span>{patient.sex === 'MALE' ? 'Male' : patient.sex === 'FEMALE' ? 'Female' : 'Unknown'}</span>
                  </>
                )}
                {patient.age !== undefined && (
                  <>
                    <span>•</span>
                    <span>{patient.age} {patient.age === 1 ? 'year' : 'years'} old</span>
                  </>
                )}
              </div>
            </div>
            <div>{renderStatusBadge()}</div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Patient Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Details</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-500">ID</h3>
                  <p className="mt-1 text-sm text-gray-900">{patient.id}</p>
                </div>
                
                {patient.weight !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500">Weight</h3>
                    <p className="mt-1 text-sm text-gray-900">{patient.weight} kg</p>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(patient.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(patient.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Owner Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{patient.ownerName}</p>
                </div>
                
                {patient.ownerEmail && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      <a href={`mailto:${patient.ownerEmail}`} className="text-blue-600 hover:underline">
                        {patient.ownerEmail}
                      </a>
                    </p>
                  </div>
                )}
                
                {patient.ownerPhone && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      <a href={`tel:${patient.ownerPhone}`} className="text-blue-600 hover:underline">
                        {patient.ownerPhone}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health History Section (if there are active monitoring plans) */}
      {hasActiveMonitoringPlans && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            <FaNotesMedical className="inline-block mr-2" />
            Health History
          </h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Tabs for different monitoring plans (if more than one) */}
            {patient.monitoringPlans && patient.monitoringPlans.filter(plan => plan.isActive).length > 1 && (
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {patient.monitoringPlans
                    .filter(plan => plan.isActive)
                    .map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => setActiveTab(plan.id)}
                        className={`py-3 px-4 text-sm font-medium whitespace-nowrap ${
                          activeTab === plan.id
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {plan.monitoringPlan.title}
                      </button>
                    ))}
                </nav>
              </div>
            )}

            {/* Active Tab Content */}
            <div className="p-6">
              {patient.monitoringPlans && activeTab && (
                <HealthHistoryTab
                  patientId={patient.id}
                  monitoringPlanPatientId={activeTab}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Plans Section - modify existing placeholder */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Monitoring Plans</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700">
              {patient.monitoringPlans && patient.monitoringPlans.length > 0
                ? `${patient.monitoringPlans.length} monitoring ${
                    patient.monitoringPlans.length === 1 ? 'plan' : 'plans'
                  } associated with this patient`
                : 'No monitoring plans have been created yet.'
              }
            </span>
            <Link
              to={`/monitoring-plans/create?patientId=${id}`}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FaClipboardList className="mr-2" /> Create New Plan
            </Link>
          </div>
          
          {/* List of monitoring plans */}
          {patient.monitoringPlans && patient.monitoringPlans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patient.monitoringPlans.map(plan => (
                    <tr key={plan.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{plan.monitoringPlan.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          plan.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(plan.enrollmentDate).toLocaleDateString()}
                        {plan.exitDate && <span> to {new Date(plan.exitDate).toLocaleDateString()}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/monitoring-plans/${plan.monitoringPlanId}`} className="text-blue-600 hover:text-blue-900 mr-3">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
              No monitoring plans have been created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage; 