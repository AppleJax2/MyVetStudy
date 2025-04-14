import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { FaChartLine, FaChartBar, FaCalendarAlt } from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface SymptomDataPoint {
  date: string;
  value: number | boolean;
  notes?: string;
}

export interface SymptomChartProps {
  title: string;
  description?: string;
  data: SymptomDataPoint[];
  dataType: 'NUMERIC' | 'BOOLEAN' | 'SCALE' | 'ENUMERATION' | 'TEXT' | 'IMAGE';
  units?: string;
  minValue?: number;
  maxValue?: number;
  options?: Record<string, any>;
  timeRange?: '7days' | '14days' | '30days' | '90days' | 'all';
}

const SymptomChart: React.FC<SymptomChartProps> = ({
  title,
  description,
  data,
  dataType,
  units,
  minValue,
  maxValue,
  options,
  timeRange = '30days'
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(timeRange);

  // Filter data based on selected time range
  const filterDataByTimeRange = (data: SymptomDataPoint[], range: string): SymptomDataPoint[] => {
    const now = new Date();
    const filtered = data.filter(point => {
      const pointDate = new Date(point.date);
      const diffTime = Math.abs(now.getTime() - pointDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (range) {
        case '7days':
          return diffDays <= 7;
        case '14days':
          return diffDays <= 14;
        case '30days':
          return diffDays <= 30;
        case '90days':
          return diffDays <= 90;
        case 'all':
        default:
          return true;
      }
    });
    
    // Sort by date ascending
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Prepare chart data
  const prepareChartData = (): ChartData<'line' | 'bar'> => {
    const filteredData = filterDataByTimeRange(data, selectedTimeRange);
    const labels = filteredData.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString();
    });
    
    const values = filteredData.map(point => {
      if (typeof point.value === 'boolean') {
        return point.value ? 1 : 0;
      }
      return point.value as number;
    });
    
    return {
      labels,
      datasets: [
        {
          label: `${title}${units ? ` (${units})` : ''}`,
          data: values,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true
        }
      ]
    };
  };

  // Chart options
  const getChartOptions = (): ChartOptions<'line' | 'bar'> => {
    const options: ChartOptions<'line' | 'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: title,
        },
        tooltip: {
          callbacks: {
            // Add notes to tooltip if available
            afterLabel: function(context) {
              const dataIndex = context.dataIndex;
              const filteredData = filterDataByTimeRange(data, selectedTimeRange);
              const note = filteredData[dataIndex]?.notes;
              return note ? `Note: ${note}` : '';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: Boolean(units),
            text: units
          }
        }
      }
    };
    
    // Set min and max values if provided
    if (minValue !== undefined || maxValue !== undefined) {
      options.scales = {
        ...options.scales,
        y: {
          ...options.scales?.y,
          min: minValue,
          max: maxValue
        }
      };
    }
    
    // Special handling for boolean data
    if (dataType === 'BOOLEAN') {
      options.scales = {
        ...options.scales,
        y: {
          ...options.scales?.y,
          min: 0,
          max: 1,
          ticks: {
            callback: function(value) {
              return value === 1 ? 'Yes' : 'No';
            }
          }
        }
      };
    }
    
    return options;
  };

  // No data message
  if (data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        <div className="h-64 flex flex-col items-center justify-center">
          <p className="text-gray-500">No data available to display</p>
        </div>
      </div>
    );
  }

  // Render appropriate chart for the data type
  const renderChart = () => {
    if (dataType === 'TEXT' || dataType === 'IMAGE') {
      return (
        <div className="h-64 flex flex-col items-center justify-center">
          <p className="text-gray-500">Chart visualization not available for this data type</p>
        </div>
      );
    }

    const chartData = prepareChartData();
    const chartOptions = getChartOptions();
    
    return (
      <div className="h-64">
        {chartType === 'line' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="flex space-x-2">
          {/* Chart type toggle */}
          <div className="border rounded-md overflow-hidden flex">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`p-2 ${
                chartType === 'line'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Line Chart"
            >
              <FaChartLine />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-2 ${
                chartType === 'bar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title="Bar Chart"
            >
              <FaChartBar />
            </button>
          </div>
          
          {/* Time range selector */}
          <div className="relative">
            <div className="inline-flex items-center">
              <FaCalendarAlt className="mr-2 text-gray-500" />
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border-none focus:ring-0 text-sm py-1 pl-1 pr-8 rounded"
              >
                <option value="7days">7 Days</option>
                <option value="14days">14 Days</option>
                <option value="30days">30 Days</option>
                <option value="90days">90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {renderChart()}
      
      {/* Statistics summary */}
      {(dataType === 'NUMERIC' || dataType === 'SCALE') && (
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">Latest</p>
            <p className="font-semibold">
              {data.length > 0 ? 
                `${data[data.length - 1].value}${units ? ` ${units}` : ''}` :
                'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">Average</p>
            <p className="font-semibold">
              {data.length > 0 ? 
                `${(data.reduce((sum, curr) => sum + (typeof curr.value === 'number' ? curr.value : 0), 0) / data.length).toFixed(1)}${units ? ` ${units}` : ''}` :
                'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">Min</p>
            <p className="font-semibold">
              {data.length > 0 ? 
                `${Math.min(...data.map(d => typeof d.value === 'number' ? d.value : 0))}${units ? ` ${units}` : ''}` :
                'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-xs text-gray-500">Max</p>
            <p className="font-semibold">
              {data.length > 0 ? 
                `${Math.max(...data.map(d => typeof d.value === 'number' ? d.value : 0))}${units ? ` ${units}` : ''}` :
                'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChart; 