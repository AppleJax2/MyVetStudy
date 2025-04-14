import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaEdit, FaChartBar, FaNotesMedical, FaUserInjured, FaShareAlt } from 'react-icons/fa';

// Remove the old Study interface since we're no longer using it
interface MonitoringPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  protocol: any;
  createdAt: string;
  shareableLink?: string;
  // ... other fields ...
}

const MonitoringPlanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [monitoringPlan, setMonitoringPlan] = useState<MonitoringPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonitoringPlan = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch monitoring plan details');
        }

        const data = await response.json();
        setMonitoringPlan(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    fetchMonitoringPlan();
  }, [id]);

  // Function to copy shareable link to clipboard
  const copyShareableLink = () => {
    if (monitoringPlan?.shareableLink) {
      navigator.clipboard.writeText(monitoringPlan.shareableLink);
      alert('Link copied to clipboard!');
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
          <p>{error}</p>
          <Link to="/monitoring-plans" className="underline mt-2 inline-block">
            Return to Monitoring Plans
          </Link>
        </div>
      </div>
    );
  }

  if (!monitoringPlan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p>Monitoring plan not found</p>
          <Link to="/monitoring-plans" className="underline mt-2 inline-block">
            Return to Monitoring Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Link to="/monitoring-plans" className="hover:text-blue-600">Monitoring Plans</Link>
          <span className="mx-2">/</span>
          <span>{monitoringPlan.title}</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{monitoringPlan.title}</h1>
            {monitoringPlan.description && (
              <p className="text-gray-600">{monitoringPlan.description}</p>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              monitoringPlan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              monitoringPlan.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
              monitoringPlan.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
              monitoringPlan.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {monitoringPlan.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Main content area (3/4 width on medium screens and up) */}
        <div className="md:col-span-3 space-y-6">
          {/* Timeline Section */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Timeline</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(monitoringPlan.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {monitoringPlan.startDate 
                      ? new Date(monitoringPlan.startDate).toLocaleDateString() 
                      : 'Not specified'}
                  </dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">End Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {monitoringPlan.endDate 
                      ? new Date(monitoringPlan.endDate).toLocaleDateString() 
                      : 'Not specified'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Protocol Section */}
          {monitoringPlan.protocol && (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Monitoring Protocol</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {monitoringPlan.protocol.frequency && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {monitoringPlan.protocol.frequency.times} time(s) per {monitoringPlan.protocol.frequency.period.toLowerCase()}
                      </dd>
                    </div>
                  )}
                  
                  {monitoringPlan.protocol.duration !== undefined && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Duration</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {monitoringPlan.protocol.duration} days
                      </dd>
                    </div>
                  )}
                  
                  {monitoringPlan.protocol.reminderEnabled !== undefined && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Reminders</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {monitoringPlan.protocol.reminderEnabled ? 'Enabled' : 'Disabled'}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
          
          {/* Other content sections can be added here */}
        </div>
        
        {/* Sidebar (1/4 width on medium screens and up) */}
        <div className="md:col-span-1">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Actions</h3>
            </div>
            <div className="px-4 py-5 sm:p-6 space-y-3">
              {/* Dashboard Action */}
              <Link
                to={`/monitoring-plans/${monitoringPlan.id}/dashboard`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaChartBar className="mr-2" /> View Dashboard
              </Link>
              
              {/* Edit Action */}
              <Link
                to={`/monitoring-plans/${monitoringPlan.id}/edit`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaEdit className="mr-2" /> Edit Monitoring Plan
              </Link>
              
              {/* Symptoms Action */}
              <Link
                to={`/monitoring-plans/${monitoringPlan.id}/symptoms`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaNotesMedical className="mr-2" /> Manage Symptoms
              </Link>
              
              {/* Patients Action */}
              <Link
                to={`/monitoring-plans/${monitoringPlan.id}/patients`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaUserInjured className="mr-2" /> Manage Patients
              </Link>
              
              {/* Share Action (if shareable link exists) */}
              {monitoringPlan.shareableLink && (
                <button
                  onClick={copyShareableLink}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaShareAlt className="mr-2" /> Copy Shareable Link
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPlanDetailPage; 