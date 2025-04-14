import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Types for our study data
interface MonitoringPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  category: string;
  organizer: string;
  participants: number;
  image?: string;
}

const MonitoringPlansPage: React.FC = () => {
  const [monitoringPlans, setMonitoringPlans] = useState<MonitoringPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonitoringPlans = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch monitoring plans');
        }

        const data = await response.json();
        setMonitoringPlans(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    fetchMonitoringPlans();
  }, []);

  if (loading) {
    return <div className="loading">Loading monitoring plans...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Monitoring Plans</h1>
        <Link to="/monitoring-plans/new" className="btn btn-primary">
          Create New Monitoring Plan
        </Link>
      </div>

      <div className="monitoring-plans-grid">
        {monitoringPlans.length === 0 ? (
          <div className="empty-state">
            <p>No monitoring plans found. Create your first monitoring plan to get started.</p>
            <Link to="/monitoring-plans/new" className="btn btn-secondary">
              Create Monitoring Plan
            </Link>
          </div>
        ) : (
          monitoringPlans.map((plan) => (
            <div key={plan.id} className="monitoring-plan-card">
              <h2 className="monitoring-plan-title">{plan.title}</h2>
              <p className="monitoring-plan-description">
                {plan.description || 'No description provided'}
              </p>
              <div className="monitoring-plan-status">
                Status: <span className={`status-${plan.status.toLowerCase()}`}>{plan.status}</span>
              </div>
              <div className="monitoring-plan-dates">
                {plan.startDate && <div>Start: {new Date(plan.startDate).toLocaleDateString()}</div>}
                {plan.endDate && <div>End: {new Date(plan.endDate).toLocaleDateString()}</div>}
              </div>
              <div className="monitoring-plan-actions">
                <Link to={`/monitoring-plans/${plan.id}`} className="btn btn-view">
                  View Details
                </Link>
                {/* Additional action buttons as needed */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MonitoringPlansPage; 