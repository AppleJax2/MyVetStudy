import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
import { format, parseISO, subDays } from 'date-fns';
import ReportView, { ObservationData } from '../components/reporting/ReportView';

interface MonitoringPlan {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt: string;
}

const ReportingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [monitoringPlan, setMonitoringPlan] = useState<MonitoringPlan | null>(null);
  const [observations, setObservations] = useState<ObservationData[]>([]);
  
  // Fetch monitoring plan and observation data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch monitoring plan details
        const planResponse = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!planResponse.ok) {
          throw new Error('Failed to fetch monitoring plan details');
        }
        
        const planData = await planResponse.json();
        setMonitoringPlan(planData);
        
        // Fetch observations for this monitoring plan
        const observationsResponse = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${id}/observations`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!observationsResponse.ok) {
          throw new Error('Failed to fetch observation data');
        }
        
        const observationsData = await observationsResponse.json();
        
        // Transform observation data to match expected format
        const formattedObservations = observationsData.map((obs: any) => ({
          id: obs.id,
          date: obs.createdAt,
          symptomId: obs.symptomTemplateId,
          symptomName: obs.symptomTemplate?.name || 'Unknown Symptom',
          dataType: obs.symptomTemplate?.dataType || 'NUMERIC',
          value: obs.value,
          notes: obs.notes,
          patientId: obs.patientId,
          patientName: obs.patient?.name || 'Unknown Patient',
          category: obs.symptomTemplate?.category,
          units: obs.symptomTemplate?.units
        }));
        
        setObservations(formattedObservations);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);
  
  // Handle PDF export
  const handleExport = (format: 'pdf' | 'csv') => {
    if (format === 'pdf') {
      // This would typically use a dedicated PDF generation library
      alert('PDF export functionality will be implemented here');
    } else if (format === 'csv') {
      // Basic CSV export
      const headers = [
        'Date',
        'Patient',
        'Symptom',
        'Value',
        'Notes'
      ].join(',');
      
      const rows = observations.map(obs => [
        obs.date,
        obs.patientName,
        obs.symptomName,
        typeof obs.value === 'string' ? `"${obs.value}"` : obs.value,
        obs.notes ? `"${obs.notes.replace(/"/g, '""')}"` : ''
      ].join(','));
      
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows.join('\n')}`;
      const encodedUri = encodeURI(csvContent);
      
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${monitoringPlan?.title || 'data'}_report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="ml-2">Loading report data...</p>
      </div>
    );
  }
  
  if (error || !monitoringPlan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error || 'Unable to load monitoring plan data'}</span>
          <div className="mt-3">
            <Link to="/monitoring-plans" className="text-blue-600 hover:text-blue-800">
              Return to Monitoring Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate date range for report with default values to avoid undefined
  const defaultStartDate = subDays(new Date(), 30).toISOString();
  const defaultEndDate = new Date().toISOString();
  
  const dateRange = {
    startDate: monitoringPlan.startDate || monitoringPlan.createdAt || defaultStartDate,
    endDate: monitoringPlan.endDate || defaultEndDate
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation header */}
      <div className="mb-6">
        <Link 
          to={`/monitoring-plans/${id}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <FaArrowLeft className="mr-2 -ml-1 h-5 w-5" />
          Back to Monitoring Plan
        </Link>
      </div>
      
      {/* Reporting content */}
      <ReportView
        monitoringPlanId={id || ''}
        monitoringPlanTitle={monitoringPlan.title}
        dateRange={dateRange}
        observationData={observations}
        onExport={handleExport}
      />
      
      {/* Empty state for no observations */}
      {observations.length === 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No observation data available</h3>
          <p className="text-gray-500 mb-4">
            There are no observations recorded for this monitoring plan yet.
          </p>
          <Link 
            to={`/monitoring-plans/${id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            View Monitoring Plan Details
          </Link>
        </div>
      )}
    </div>
  );
};

export default ReportingPage; 