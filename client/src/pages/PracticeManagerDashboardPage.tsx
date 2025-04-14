import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPracticeStatistics, IPracticeStatistics } from '../services/practiceService';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FaUsers, 
  FaPaw, 
  FaClipboardList, 
  FaChartLine, 
  FaCalendarAlt,
  FaUserMd
} from 'react-icons/fa';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { format } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PracticeManagerDashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<IPracticeStatistics | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchPracticeStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPracticeStatistics();
        setStatistics(data);
      } catch (err: any) {
        console.error('Error fetching practice statistics:', err);
        setError(err.response?.data?.message || 'Failed to load practice statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPracticeStatistics();
  }, []);

  // Prepare chart data
  const observationsTrendData = {
    labels: statistics?.observationsTrend.map(item => format(new Date(item.date), 'MMM d')) || [],
    datasets: [
      {
        label: 'Daily Observations',
        data: statistics?.observationsTrend.map(item => item.count) || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const patientsBySpeciesData = {
    labels: statistics?.patientsBySpecies.map(item => item.species) || [],
    datasets: [
      {
        label: 'Patients by Species',
        data: statistics?.patientsBySpecies.map(item => item.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const monitoringPlanStatusData = {
    labels: statistics?.monitoringPlansByStatus.map(item => item.status) || [],
    datasets: [
      {
        label: 'Monitoring Plans by Status',
        data: statistics?.monitoringPlansByStatus.map(item => item.count) || [],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        hoverOffset: 4,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Practice Dashboard</h1>
        <p className="text-gray-600">Overview of your veterinary practice</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <FaPaw className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Patients</p>
              <p className="text-2xl font-bold">{statistics?.summary.totalPatients || 0}</p>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-green-600">{statistics?.summary.activePatients || 0}</span> active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <FaClipboardList className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monitoring Plans</p>
              <p className="text-2xl font-bold">{statistics?.summary.totalMonitoringPlans || 0}</p>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-green-600">{statistics?.summary.activeMonitoringPlans || 0}</span> active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <FaUserMd className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Team Members</p>
              <p className="text-2xl font-bold">{statistics?.summary.teamMembers || 0}</p>
              <p className="text-sm text-gray-500">
                <button 
                  onClick={() => navigate('/team')}
                  className="text-purple-600 hover:underline"
                >
                  Manage Team
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-full p-3 mr-4">
              <FaChartLine className="text-yellow-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Observations</p>
              <p className="text-2xl font-bold">{statistics?.summary.totalObservations || 0}</p>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-green-600">{statistics?.summary.recentObservations || 0}</span> this week
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Observations Trend (Last 30 Days)</h2>
          <div className="h-64">
            <Line 
              data={observationsTrendData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Patients by Species</h2>
          <div className="h-64">
            <Bar 
              data={patientsBySpeciesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monitoring Plans by Status</h2>
          <div className="h-64 flex justify-center">
            <div className="w-64">
              <Pie 
                data={monitoringPlanStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="overflow-y-auto h-64">
            <ul className="divide-y divide-gray-200">
              {statistics?.activityLog.map((activity, index) => (
                <li key={activity.id || index} className="py-3">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center">
                        {activity.type.includes('PATIENT') ? (
                          <FaPaw className="text-blue-600" />
                        ) : activity.type.includes('MONITORING_PLAN') ? (
                          <FaClipboardList className="text-green-600" />
                        ) : (
                          <FaCalendarAlt className="text-purple-600" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        By {activity.userName} • {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              
              {statistics?.activityLog.length === 0 && (
                <li className="py-3 text-center text-gray-500">No recent activity</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/patients/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded flex items-center justify-center"
          >
            <FaPaw className="mr-2" /> Add New Patient
          </button>

          <button
            onClick={() => navigate('/monitoring-plans/new')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded flex items-center justify-center"
          >
            <FaClipboardList className="mr-2" /> Create Monitoring Plan
          </button>

          <button
            onClick={() => navigate('/team')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded flex items-center justify-center"
          >
            <FaUsers className="mr-2" /> Manage Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeManagerDashboardPage; 