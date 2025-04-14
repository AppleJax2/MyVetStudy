import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaCheck, FaClock, FaBell } from 'react-icons/fa';
import SymptomChart from '../components/monitoring/SymptomChart';

// Interface for the monitoring plan data
interface SharedMonitoringPlan {
  id: string;
  title: string;
  description: string | null;
  protocol: {
    frequency?: {
      times: number;
      period: string;
    };
    duration?: number;
    reminderEnabled?: boolean;
  };
  startDate: string | null;
  endDate: string | null;
  status: string;
  symptomTemplates: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    dataType: string;
    units: string | null;
    minValue: number | null;
    maxValue: number | null;
  }>;
  patientCount: number;
}

const SharedMonitoringPlanPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [monitoringPlan, setMonitoringPlan] = useState<SharedMonitoringPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedMonitoringPlan = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/shared/${token}`);
        
        if (!response.ok) {
          throw new Error('This shared monitoring plan is no longer available or has expired.');
        }
        
        const data = await response.json();
        setMonitoringPlan(data.data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedMonitoringPlan();
  }, [token]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error || !monitoringPlan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error</p>
          <p>{error || 'Monitoring plan not found'}</p>
          <Link to="/" className="text-red-700 underline mt-2 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-2" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold mt-4">{monitoringPlan.title}</h1>
        {monitoringPlan.description && (
          <p className="mt-2 text-gray-600">{monitoringPlan.description}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow overflow-hidden rounded-lg col-span-2">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Monitoring Plan Details</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">
                  {monitoringPlan.status.toLowerCase()}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Active Patients</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {monitoringPlan.patientCount}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(monitoringPlan.startDate)}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">End Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(monitoringPlan.endDate)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Monitoring Protocol</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="space-y-4">
              {monitoringPlan.protocol?.frequency && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FaCalendarAlt className="mr-2 text-blue-500" /> Frequency
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {monitoringPlan.protocol.frequency.times} time(s) per {monitoringPlan.protocol.frequency.period.toLowerCase()}
                  </dd>
                </div>
              )}
              
              {monitoringPlan.protocol?.duration !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FaClock className="mr-2 text-blue-500" /> Duration
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {monitoringPlan.protocol.duration} days
                  </dd>
                </div>
              )}
              
              {monitoringPlan.protocol?.reminderEnabled !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FaBell className="mr-2 text-blue-500" /> Reminders
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    {monitoringPlan.protocol.reminderEnabled ? (
                      <>
                        <FaCheck className="mr-1 text-green-500" /> Enabled
                      </>
                    ) : (
                      'Disabled'
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Symptoms Being Monitored</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {monitoringPlan.symptomTemplates.length === 0 ? (
            <p className="text-gray-500">No symptoms have been defined for this monitoring plan.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monitoringPlan.symptomTemplates.map(symptom => (
                <div key={symptom.id} className="border rounded p-4">
                  <h4 className="font-medium">{symptom.name}</h4>
                  {symptom.description && (
                    <p className="text-sm text-gray-600 mt-1">{symptom.description}</p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Type:</span> {symptom.dataType}
                    </div>
                    {symptom.units && (
                      <div>
                        <span className="text-gray-500">Units:</span> {symptom.units}
                      </div>
                    )}
                    {(symptom.minValue !== null || symptom.maxValue !== null) && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Range:</span>
                        {symptom.minValue !== null ? ` ${symptom.minValue}` : ' --'}
                        {' to '}
                        {symptom.maxValue !== null ? `${symptom.maxValue}` : '--'}
                        {symptom.units ? ` ${symptom.units}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-8">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Interested in joining this monitoring plan?</h3>
        <p className="text-blue-600 mb-4">
          Contact the veterinary practice managing this monitoring plan to discuss how your pet can participate.
        </p>
        <Link 
          to="/register"
          className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Create an Account
        </Link>
      </div>
    </div>
  );
};

export default SharedMonitoringPlanPage; 