import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Import the api service
import { toast } from 'react-toastify'; // Import toast for error notifications

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
        setLoading(true);
        setError(null);
        // Use api.get instead of fetch
        const response = await api.get('/monitoring-plans'); 

        // Axios automatically checks for response.ok and throws for non-2xx statuses
        // The data is directly available in response.data
        setMonitoringPlans(response.data);

      } catch (err: any) {
        console.error("Failed to fetch monitoring plans:", err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch monitoring plans';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoringPlans();
  }, []);

  if (loading) {
    return <div className="loading">Loading monitoring plans...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
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