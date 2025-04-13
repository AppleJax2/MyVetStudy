import React from 'react';
import './DashboardPage.css'; // Add CSS for styling and animation

const DashboardPage: React.FC = () => {
  // Example data - replace with actual data fetching later
  const summaryCards = [
    { id: 1, title: 'Active Studies', value: '3', icon: '🔬' }, // Placeholder icons
    { id: 2, title: 'Pending Observations', value: '12', icon: '📝' },
    { id: 3, title: 'Recent Notifications', value: '5', icon: '🔔' },
  ];

  return (
    <div className="dashboard-container fade-in">
      <h1>Dashboard</h1>
      <p>Welcome back! Here's a summary of your activities.</p>

      <div className="summary-cards-grid">
        {summaryCards.map((card) => (
          <div key={card.id} className="summary-card">
            <div className="card-icon">{card.icon}</div>
            <div className="card-content">
              <h2>{card.title}</h2>
              <p>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add more dashboard components here as needed */}
    </div>
  );
};

export default DashboardPage; 