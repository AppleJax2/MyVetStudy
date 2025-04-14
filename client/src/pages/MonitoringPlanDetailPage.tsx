import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// Study interface
interface Study {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  status: 'Active' | 'Completed' | 'Upcoming';
  category: string;
  startDate: string;
  endDate: string;
  organizer: string;
  participants: number;
  maxParticipants?: number;
  eligibility?: string[];
  requirements?: string[];
  benefits?: string[];
  contactEmail?: string;
  contactPhone?: string;
  image?: string;
}

interface MonitoringPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  protocol: any;
  createdAt: string;
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

  if (loading) {
    return <div className="loading">Loading monitoring plan details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!monitoringPlan) {
    return <div className="not-found">Monitoring plan not found</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="breadcrumbs">
          <Link to="/monitoring-plans">Monitoring Plans</Link> / {monitoringPlan.title}
        </div>
        <h1>{monitoringPlan.title}</h1>
        <div className="status-badge">
          <span className={`status-${monitoringPlan.status.toLowerCase()}`}>
            {monitoringPlan.status}
          </span>
        </div>
      </div>

      <div className="content-grid">
        <div className="main-content">
          <section className="details-section">
            <h2>Description</h2>
            <p>{monitoringPlan.description || 'No description provided'}</p>
          </section>

          <section className="timeline-section">
            <h2>Timeline</h2>
            <div className="timeline-details">
              <div className="timeline-item">
                <div className="timeline-label">Created:</div>
                <div className="timeline-value">
                  {new Date(monitoringPlan.createdAt).toLocaleDateString()}
                </div>
              </div>
              {monitoringPlan.startDate && (
                <div className="timeline-item">
                  <div className="timeline-label">Start Date:</div>
                  <div className="timeline-value">
                    {new Date(monitoringPlan.startDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {monitoringPlan.endDate && (
                <div className="timeline-item">
                  <div className="timeline-label">End Date:</div>
                  <div className="timeline-value">
                    {new Date(monitoringPlan.endDate).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Other sections like Symptoms, Patients, etc. */}
        </div>

        <div className="sidebar">
          <div className="actions-panel">
            <h3>Actions</h3>
            <div className="action-buttons">
              <Link to={`/monitoring-plans/${monitoringPlan.id}/edit`} className="btn btn-primary">
                Edit Monitoring Plan
              </Link>
              <Link to={`/monitoring-plans/${monitoringPlan.id}/symptoms`} className="btn btn-secondary">
                Manage Symptoms
              </Link>
              <Link to={`/monitoring-plans/${monitoringPlan.id}/patients`} className="btn btn-secondary">
                Manage Patients
              </Link>
              {/* Additional action buttons */}
            </div>
          </div>

          {/* Other sidebar panels */}
        </div>
      </div>
    </div>
  );
};

export default MonitoringPlanDetailPage; 