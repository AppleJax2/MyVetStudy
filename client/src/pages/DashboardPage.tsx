import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css'; // Add CSS for styling and animation

const DashboardPage: React.FC = () => {
  // Example data - replace with actual data fetching later
  const [summaryCards] = useState([
    { id: 1, title: 'Active Studies', value: '3', icon: '🔬', color: 'bg-blue-500' },
    { id: 2, title: 'Pending Observations', value: '12', icon: '📝', color: 'bg-yellow-500' },
    { id: 3, title: 'Recent Notifications', value: '5', icon: '🔔', color: 'bg-purple-500' },
  ]);

  const [recentStudies] = useState([
    { id: 'study-1', title: 'Canine Arthritis Study', status: 'Active', progress: 65, dueDate: '2024-05-15' },
    { id: 'study-2', title: 'Feline Nutrition Impact', status: 'Active', progress: 30, dueDate: '2024-06-20' },
    { id: 'study-3', title: 'Equine Exercise Recovery', status: 'Active', progress: 85, dueDate: '2024-04-30' },
  ]);

  const [upcomingTasks] = useState([
    { id: 1, title: 'Submit weekly observation', study: 'Canine Arthritis Study', dueDate: '2024-04-20' },
    { id: 2, title: 'Record medication dosage', study: 'Feline Nutrition Impact', dueDate: '2024-04-22' },
    { id: 3, title: 'Complete survey', study: 'Equine Exercise Recovery', dueDate: '2024-04-18' },
  ]);

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's a summary of your activities.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {summaryCards.map((card) => (
          <div key={card.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl mr-4`}>
                {card.icon}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{card.title}</h2>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Studies */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Active Studies</h2>
          <Link to="/studies" className="text-blue-600 hover:text-blue-800 font-medium">View All</Link>
        </div>
        
        <div className="space-y-4">
          {recentStudies.map((study) => (
            <div key={study.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{study.title}</h3>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">{study.status}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${study.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{study.progress}% Complete</span>
                <span>Due: {new Date(study.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="mt-3">
                <Link to={`/studies/${study.id}`} className="btn-primary text-sm">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Upcoming Tasks</h2>
          <button className="text-blue-600 hover:text-blue-800 font-medium">Mark All Complete</button>
        </div>
        <div className="divide-y divide-gray-100">
          {upcomingTasks.map((task) => (
            <div key={task.id} className="py-3 flex justify-between items-center">
              <div>
                <h3 className="font-medium">{task.title}</h3>
                <p className="text-sm text-gray-500">{task.study}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                <button className="btn-secondary text-xs py-1">Complete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 