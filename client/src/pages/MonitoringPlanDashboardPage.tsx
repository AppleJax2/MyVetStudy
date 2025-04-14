import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaShareAlt, FaCalendarAlt } from 'react-icons/fa';
import SymptomChart, { SymptomDataPoint } from '../components/monitoring/SymptomChart';

interface MonitoringPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  protocol: {
    frequency?: {
      times: number;
      period: string;
    };
    duration?: number;
    reminderEnabled?: boolean;
    shareableLink?: boolean;
  };
  shareableLink?: string;
}

interface Patient {
  id: string;
  name: string;
  species: string;
  breed: string;
}

interface Symptom {
  id: string;
  name: string;
  description: string;
  category: string;
  dataType: 'NUMERIC' | 'BOOLEAN' | 'SCALE' | 'ENUMERATION' | 'TEXT' | 'IMAGE';
  units: string | null;
  minValue: number | null;
  maxValue: number | null;
  observations: {
    recordedAt: string;
    value: any;
    notes: string | null;
  }[];
}

const MonitoringPlanDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [monitoringPlan, setMonitoringPlan] = useState<MonitoringPlan | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7days' | '14days' | '30days' | '90days' | 'all'>('30days');

  // Fetch monitoring plan data
  useEffect(() => {
    const fetchMonitoringPlan = async () => {
      try {
        setLoading(true);
        
        // Fetch the monitoring plan
        const planResponse = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!planResponse.ok) {
          throw new Error('Failed to fetch monitoring plan');
        }
        
        const planData = await planResponse.json();
        setMonitoringPlan(planData);
        
        // Fetch patients for this plan
        const patientsResponse = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${id}/patients`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();
          setPatients(patientsData);
          
          // Set the first patient as selected by default
          if (patientsData.length > 0) {
            setSelectedPatient(patientsData[0].id);
          }
        }
        
        // Fetch symptoms
        const symptomsResponse = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${id}/symptoms`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (symptomsResponse.ok) {
          const symptomsData = await symptomsResponse.json();
          setSymptoms(symptomsData);
        }
        
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchMonitoringPlan();
    }
  }, [id]);

  // Fetch observations when patient selection changes
  useEffect(() => {
    const fetchObservations = async () => {
      if (!selectedPatient || !id) return;
      
      try {
        // Update the symptoms with observations for the selected patient
        const observations = await Promise.all(
          symptoms.map(async (symptom) => {
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/monitoring-plans/${id}/patients/${selectedPatient}/symptoms/${symptom.id}/observations`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
            
            if (response.ok) {
              const observationsData = await response.json();
              return {
                ...symptom,
                observations: observationsData
              };
            }
            
            return { ...symptom, observations: [] };
          })
        );
        
        setSymptoms(observations);
      } catch (err) {
        console.error('Failed to fetch observations:', err);
      }
    };
    
    fetchObservations();
  }, [selectedPatient, id]);

  // Format symptom data for charts
  const formatSymptomDataForChart = (symptom: Symptom): SymptomDataPoint[] => {
    return symptom.observations.map(obs => ({
      date: obs.recordedAt,
      value: obs.value,
      notes: obs.notes || undefined
    }));
  };

  // Calculate progress
  const calculateProgress = (): number => {
    if (!monitoringPlan || !monitoringPlan.startDate || !monitoringPlan.endDate) {
      return 0;
    }
    
    const start = new Date(monitoringPlan.startDate);
    const end = new Date(monitoringPlan.endDate);
    const today = new Date();
    
    if (today < start) return 0;
    if (today > end) return 100;
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = today.getTime() - start.getTime();
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  };

  // Download data as CSV
  const downloadData = () => {
    if (!symptoms.length || !selectedPatient) return;
    
    // Create CSV header
    let csv = 'Date,';
    symptoms.forEach(symptom => {
      csv += `${symptom.name}${symptom.units ? ` (${symptom.units})` : ''},`;
    });
    csv += '\n';
    
    // Get all unique dates from all symptoms
    const allDates = new Set<string>();
    symptoms.forEach(symptom => {
      symptom.observations.forEach(obs => {
        allDates.add(new Date(obs.recordedAt).toISOString().split('T')[0]);
      });
    });
    
    // Sort dates
    const sortedDates = Array.from(allDates).sort();
    
    // Create rows for each date
    sortedDates.forEach(date => {
      csv += `${date},`;
      
      symptoms.forEach(symptom => {
        const observation = symptom.observations.find(
          obs => new Date(obs.recordedAt).toISOString().split('T')[0] === date
        );
        
        if (observation) {
          csv += `${observation.value},`;
        } else {
          csv += ',';
        }
      });
      
      csv += '\n';
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `monitoring-plan-${monitoringPlan?.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
          <p>{error || 'Failed to load monitoring plan'}</p>
          <Link to="/monitoring-plans" className="underline mt-2 inline-block">
            Return to Monitoring Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center mb-2">
            <Link to="/monitoring-plans" className="text-blue-600 hover:text-blue-800 mr-2">
              <FaArrowLeft />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {monitoringPlan.title}
            </h1>
          </div>
          {monitoringPlan.description && (
            <p className="text-gray-600">{monitoringPlan.description}</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <FaDownload className="mr-2" /> Export Data
          </button>
          
          {monitoringPlan.shareableLink && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(monitoringPlan.shareableLink || '');
                alert('Link copied to clipboard!');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <FaShareAlt className="mr-2" /> Share
            </button>
          )}
        </div>
      </div>
      
      {/* Status and Time Period */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
              monitoringPlan.status === 'ACTIVE' ? 'bg-green-500' :
              monitoringPlan.status === 'PAUSED' ? 'bg-yellow-500' :
              monitoringPlan.status === 'COMPLETED' ? 'bg-blue-500' :
              monitoringPlan.status === 'ARCHIVED' ? 'bg-gray-500' : 'bg-gray-300'
            }`}></span>
            <span className="text-lg font-semibold">{monitoringPlan.status}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Time Period</h3>
          <div className="flex items-center text-lg font-semibold">
            <FaCalendarAlt className="text-gray-400 mr-2" />
            {monitoringPlan.startDate ? (
              <span>
                {new Date(monitoringPlan.startDate).toLocaleDateString()} 
                {monitoringPlan.endDate ? ` - ${new Date(monitoringPlan.endDate).toLocaleDateString()}` : ''}
              </span>
            ) : (
              <span>Not specified</span>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Progress</h3>
          <div className="flex items-center mb-1">
            <span className="text-lg font-semibold">{calculateProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Patient Selector */}
      {patients.length > 0 && (
        <div className="mb-6">
          <label htmlFor="patient-selector" className="block text-sm font-medium text-gray-700 mb-1">
            Select Patient
          </label>
          <select
            id="patient-selector"
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="block w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name} - {patient.species} {patient.breed ? `(${patient.breed})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Time Range Selector */}
      <div className="mb-6 flex justify-end">
        <div className="inline-flex items-center">
          <span className="text-sm text-gray-500 mr-2">Time Range:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="7days">7 Days</option>
            <option value="14days">14 Days</option>
            <option value="30days">30 Days</option>
            <option value="90days">90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>
      
      {/* Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {symptoms.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No symptoms have been defined for this monitoring plan.</p>
            <Link to={`/monitoring-plans/${id}/edit`} className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block">
              Edit Monitoring Plan to add symptoms
            </Link>
          </div>
        ) : (
          symptoms.map(symptom => (
            <SymptomChart
              key={symptom.id}
              title={symptom.name}
              description={symptom.description}
              data={formatSymptomDataForChart(symptom)}
              dataType={symptom.dataType}
              units={symptom.units || undefined}
              minValue={symptom.minValue !== null ? symptom.minValue : undefined}
              maxValue={symptom.maxValue !== null ? symptom.maxValue : undefined}
              timeRange={timeRange}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MonitoringPlanDashboardPage; 