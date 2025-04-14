import React, { useState, useMemo } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { FaFilePdf, FaFileExcel, FaChartLine, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import SymptomChart from '../monitoring/SymptomChart';
import ProgressIndicator, { ProgressData } from '../monitoring/ProgressIndicator';
import TimelineVisualization, { TimelineEvent } from '../monitoring/TimelineVisualization';

// Type definitions
export interface ObservationData {
  id: string;
  date: string; // ISO date string
  symptomId: string;
  symptomName: string;
  dataType: 'NUMERIC' | 'BOOLEAN' | 'SCALE' | 'ENUMERATION' | 'TEXT' | 'IMAGE';
  value: number | boolean | string;
  notes?: string;
  patientId: string;
  patientName: string;
  category?: string;
  units?: string;
}

export interface ReportViewProps {
  monitoringPlanId: string;
  monitoringPlanTitle: string;
  dateRange?: {
    startDate: string; // ISO date string
    endDate: string;   // ISO date string
  };
  observationData: ObservationData[];
  className?: string;
  onExport?: (format: 'pdf' | 'csv') => void;
}

// Define a type for time range selection
type TimeRangeOption = '7days' | '14days' | '30days' | '90days' | 'all';

const ReportView: React.FC<ReportViewProps> = ({
  monitoringPlanId,
  monitoringPlanTitle,
  dateRange,
  observationData,
  className = '',
  onExport
}) => {
  // State
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeOption>('30days');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'timeline'>('summary');
  
  // Get unique symptom and patient lists
  const { 
    uniqueSymptoms, 
    uniquePatients, 
    filteredData,
    timeRangeFilteredData
  } = useMemo(() => {
    // Extract unique symptoms and patients
    const symptoms = Array.from(new Set(observationData.map(obs => obs.symptomId)))
      .map(id => {
        const obs = observationData.find(o => o.symptomId === id);
        return {
          id,
          name: obs?.symptomName || '',
          dataType: obs?.dataType || 'NUMERIC'
        };
      });
    
    const patients = Array.from(new Set(observationData.map(obs => obs.patientId)))
      .map(id => {
        const obs = observationData.find(o => o.patientId === id);
        return {
          id,
          name: obs?.patientName || ''
        };
      });
    
    // Filter by selected symptoms and patients
    const filtered = observationData.filter(obs => {
      const symptomMatch = selectedSymptoms.length === 0 || selectedSymptoms.includes(obs.symptomId);
      const patientMatch = selectedPatients.length === 0 || selectedPatients.includes(obs.patientId);
      return symptomMatch && patientMatch;
    });
    
    // Apply time range filter
    const now = new Date();
    const timeFiltered = filtered.filter(obs => {
      const obsDate = parseISO(obs.date);
      
      switch (selectedTimeRange) {
        case '7days':
          return obsDate >= subDays(now, 7);
        case '14days':
          return obsDate >= subDays(now, 14);
        case '30days':
          return obsDate >= subDays(now, 30);
        case '90days':
          return obsDate >= subDays(now, 90);
        case 'all':
          return true;
        default:
          return true;
      }
    });
    
    return {
      uniqueSymptoms: symptoms,
      uniquePatients: patients,
      filteredData: filtered,
      timeRangeFilteredData: timeFiltered
    };
  }, [observationData, selectedSymptoms, selectedPatients, selectedTimeRange]);
  
  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats: Array<{
      symptomId: string;
      symptomName: string;
      dataType: string;
      latest?: number | boolean;
      previous?: number | boolean;
      average?: number;
      min?: number;
      max?: number;
      change?: number;
      units?: string;
      count: number;
    }> = [];
    
    // Group by symptom
    const groupedData: Record<string, ObservationData[]> = {};
    timeRangeFilteredData.forEach(obs => {
      if (!groupedData[obs.symptomId]) {
        groupedData[obs.symptomId] = [];
      }
      groupedData[obs.symptomId].push(obs);
    });
    
    // Calculate stats for each symptom
    Object.entries(groupedData).forEach(([symptomId, observations]) => {
      // Sort by date
      const sortedObs = [...observations].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      const symptomName = sortedObs[0]?.symptomName || '';
      const dataType = sortedObs[0]?.dataType || '';
      const units = sortedObs[0]?.units;
      
      // Extract numeric values if applicable
      const numericValues = sortedObs
        .filter(obs => typeof obs.value === 'number')
        .map(obs => obs.value as number);
      
      const stat = {
        symptomId,
        symptomName,
        dataType,
        units,
        count: sortedObs.length
      };
      
      // Add numeric stats if applicable
      if (numericValues.length > 0) {
        const latest = numericValues[0];
        const previous = numericValues[1];
        
        Object.assign(stat, {
          latest,
          previous,
          average: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          change: previous !== undefined ? latest - previous : undefined
        });
      } else if (typeof sortedObs[0]?.value === 'boolean') {
        // Boolean values
        Object.assign(stat, {
          latest: sortedObs[0]?.value,
          previous: sortedObs[1]?.value
        });
      }
      
      stats.push(stat);
    });
    
    return stats;
  }, [timeRangeFilteredData]);
  
  // Prepare chart data by symptom
  const chartDataBySymptom = useMemo(() => {
    const chartData: Record<string, any> = {};
    
    uniqueSymptoms.forEach(symptom => {
      const symptomObservations = timeRangeFilteredData.filter(
        obs => obs.symptomId === symptom.id
      );
      
      if (symptomObservations.length > 0) {
        // Sort by date ascending for charts
        const sortedData = [...symptomObservations].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Format data for charts
        chartData[symptom.id] = {
          title: symptom.name,
          dataType: symptom.dataType,
          units: sortedData[0]?.units,
          data: sortedData.map(obs => ({
            date: obs.date,
            value: obs.value,
            notes: obs.notes
          }))
        };
      }
    });
    
    return chartData;
  }, [uniqueSymptoms, timeRangeFilteredData]);
  
  // Prepare timeline events
  const timelineEvents = useMemo((): TimelineEvent[] => {
    return timeRangeFilteredData.map(obs => ({
      id: obs.id,
      date: obs.date,
      value: obs.value,
      notes: obs.notes,
      type: 'observation',
      category: obs.symptomName,
      source: obs.patientName,
      severity: typeof obs.value === 'number'
        ? (obs.value > 7 ? 'high' : obs.value > 4 ? 'medium' : 'low')
        : 'medium'
    }));
  }, [timeRangeFilteredData]);
  
  // Prepare progress indicator data
  const progressData = useMemo(() => {
    const progressItems: Record<string, ProgressData> = {};
    
    summaryStats.forEach(stat => {
      if (stat.dataType === 'NUMERIC' || stat.dataType === 'SCALE') {
        if (stat.latest !== undefined && stat.previous !== undefined) {
          const isInverted = stat.symptomName.toLowerCase().includes('pain') || 
                            stat.symptomName.toLowerCase().includes('fever') ||
                            stat.symptomName.toLowerCase().includes('swelling');
          
          progressItems[stat.symptomId] = {
            current: stat.latest as number,
            previous: stat.previous as number,
            unit: stat.units,
            isInverted
          };
        }
      }
    });
    
    return progressItems;
  }, [summaryStats]);
  
  // Toggle symptom selection
  const toggleSymptomSelection = (symptomId: string) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptomId)) {
        return prev.filter(id => id !== symptomId);
      } else {
        return [...prev, symptomId];
      }
    });
  };
  
  // Toggle patient selection
  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients(prev => {
      if (prev.includes(patientId)) {
        return prev.filter(id => id !== patientId);
      } else {
        return [...prev, patientId];
      }
    });
  };
  
  // Handle export
  const handleExport = (format: 'pdf' | 'csv') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export implementation
      if (format === 'csv') {
        exportCSV();
      } else {
        alert('PDF export would be implemented here');
      }
    }
  };
  
  // Basic CSV export implementation
  const exportCSV = () => {
    const headers = [
      'Date',
      'Patient',
      'Symptom',
      'Value',
      'Notes'
    ].join(',');
    
    const rows = filteredData.map(obs => [
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
    link.setAttribute('download', `${monitoringPlanTitle}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle time range selection
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimeRange(e.target.value as TimeRangeOption);
  };
  
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Report header */}
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Monitoring Plan Report: {monitoringPlanTitle}
          </h3>
          {dateRange && (
            <p className="text-sm text-gray-500 mt-1">
              {format(parseISO(dateRange.startDate), 'MMMM d, yyyy')} - {format(parseISO(dateRange.endDate), 'MMMM d, yyyy')}
            </p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaFilePdf className="mr-2" /> Export PDF
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaFileExcel className="mr-2" /> Export CSV
          </button>
        </div>
      </div>
      
      {/* Filter controls */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 sm:px-6 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center">
          <FaFilter className="text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700 mr-2">Filters:</span>
          
          {/* Time range selector */}
          <div className="relative">
            <select
              value={selectedTimeRange}
              onChange={handleTimeRangeChange}
              className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm rounded-md"
            >
              <option value="7days">Last 7 Days</option>
              <option value="14days">Last 14 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Symptom selector */}
          <div className="relative">
            <details className="relative">
              <summary className="flex items-center px-3 py-1.5 text-sm border rounded-md cursor-pointer hover:bg-gray-50">
                <span>Symptoms ({selectedSymptoms.length ? selectedSymptoms.length : 'All'})</span>
              </summary>
              <div className="absolute right-0 z-10 mt-1 bg-white border rounded-md shadow-lg w-64 max-h-60 overflow-y-auto">
                <div className="p-2">
                  {uniqueSymptoms.map(symptom => (
                    <div key={symptom.id} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={`symptom-${symptom.id}`}
                        checked={selectedSymptoms.length === 0 || selectedSymptoms.includes(symptom.id)}
                        onChange={() => toggleSymptomSelection(symptom.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`symptom-${symptom.id}`} className="ml-2 text-sm text-gray-700">
                        {symptom.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
          
          {/* Patient selector */}
          <div className="relative">
            <details className="relative">
              <summary className="flex items-center px-3 py-1.5 text-sm border rounded-md cursor-pointer hover:bg-gray-50">
                <span>Patients ({selectedPatients.length ? selectedPatients.length : 'All'})</span>
              </summary>
              <div className="absolute right-0 z-10 mt-1 bg-white border rounded-md shadow-lg w-64 max-h-60 overflow-y-auto">
                <div className="p-2">
                  {uniquePatients.map(patient => (
                    <div key={patient.id} className="flex items-center p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id={`patient-${patient.id}`}
                        checked={selectedPatients.length === 0 || selectedPatients.includes(patient.id)}
                        onChange={() => togglePatientSelection(patient.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`patient-${patient.id}`} className="ml-2 text-sm text-gray-700">
                        {patient.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detailed Charts
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Timeline
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="p-4">
        {/* Summary tab */}
        {activeTab === 'summary' && (
          <div>
            <div className="mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Summary Statistics</h4>
              
              {summaryStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No data available for the selected filters
                </div>
              ) : (
                <div>
                  {/* Key metrics and trends */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {Object.entries(progressData).map(([symptomId, data]) => {
                      const stat = summaryStats.find(s => s.symptomId === symptomId);
                      return (
                        <ProgressIndicator
                          key={symptomId}
                          title={stat?.symptomName || ''}
                          data={data}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Summary table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Symptom
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Latest
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Previous
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Change
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Average
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Min/Max
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Observations
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {summaryStats.map((stat) => (
                          <tr key={stat.symptomId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {stat.symptomName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stat.latest !== undefined
                                ? typeof stat.latest === 'boolean'
                                  ? stat.latest ? 'Yes' : 'No'
                                  : `${stat.latest}${stat.units ? ` ${stat.units}` : ''}`
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stat.previous !== undefined
                                ? typeof stat.previous === 'boolean'
                                  ? stat.previous ? 'Yes' : 'No'
                                  : `${stat.previous}${stat.units ? ` ${stat.units}` : ''}`
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stat.change !== undefined
                                ? <span className={stat.change > 0 ? 'text-green-600' : stat.change < 0 ? 'text-red-600' : ''}>
                                    {stat.change > 0 ? '+' : ''}{stat.change}
                                  </span>
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stat.average !== undefined
                                ? `${stat.average.toFixed(1)}${stat.units ? ` ${stat.units}` : ''}`
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stat.min !== undefined && stat.max !== undefined
                                ? `${stat.min} - ${stat.max}${stat.units ? ` ${stat.units}` : ''}`
                                : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stat.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Detailed charts tab */}
        {activeTab === 'details' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Detailed Charts</h4>
            
            {Object.keys(chartDataBySymptom).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No data available for the selected filters
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(chartDataBySymptom).map(([symptomId, chartData]) => (
                  <SymptomChart
                    key={symptomId}
                    title={chartData.title}
                    data={chartData.data}
                    dataType={chartData.dataType}
                    units={chartData.units}
                    timeRange={selectedTimeRange}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Timeline tab */}
        {activeTab === 'timeline' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Timeline View</h4>
            
            {timelineEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No events available for the selected filters
              </div>
            ) : (
              <TimelineVisualization
                title={`${monitoringPlanTitle} Timeline`}
                events={timelineEvents}
                initialTimeRange={
                  selectedTimeRange === '7days' ? 7 : 
                  selectedTimeRange === '14days' ? 14 : 
                  selectedTimeRange === '30days' ? 30 : 
                  selectedTimeRange === '90days' ? 90 : 60
                }
              />
            )}
          </div>
        )}
      </div>
      
      {/* Report metadata/footer */}
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <div>
            Total observations: {filteredData.length}
          </div>
          <div>
            <FaCalendarAlt className="inline mr-1" />
            Report generated: {format(new Date(), 'MMMM d, yyyy h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView; 