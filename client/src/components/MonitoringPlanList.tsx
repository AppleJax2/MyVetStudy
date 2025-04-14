import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMonitoringPlans, MonitoringPlan, deleteMonitoringPlan } from '../services/monitoringPlanService';
import { Button, Card, Col, Row, Badge, Modal, Spinner } from 'react-bootstrap';
import { format } from 'date-fns';
import { BsTrash, BsPencil, BsEye, BsBarChart } from 'react-icons/bs';

const MonitoringPlanList: React.FC = () => {
  const [monitoringPlans, setMonitoringPlans] = useState<MonitoringPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchMonitoringPlans();
  }, []);

  const fetchMonitoringPlans = async () => {
    try {
      setLoading(true);
      const data = await getMonitoringPlans();
      setMonitoringPlans(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch monitoring plans. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setPlanToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (planToDelete) {
      try {
        await deleteMonitoringPlan(planToDelete);
        setMonitoringPlans(monitoringPlans.filter(plan => plan.id !== planToDelete));
        setShowDeleteModal(false);
        setPlanToDelete(null);
      } catch (err) {
        console.error(err);
        setError('Failed to delete monitoring plan. Please try again later.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge bg="success">Active</Badge>;
      case 'completed':
        return <Badge bg="secondary">Completed</Badge>;
      case 'planned':
        return <Badge bg="primary">Planned</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="info">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger my-3">{error}</div>;
  }

  return (
    <div className="monitoring-plan-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Monitoring Plans</h2>
        <Link to="/monitoring-plans/new" className="btn btn-primary">
          Create New Plan
        </Link>
      </div>

      {monitoringPlans.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <h5>No monitoring plans found</h5>
            <p>Get started by creating your first monitoring plan</p>
            <Link to="/monitoring-plans/new" className="btn btn-primary">
              Create New Plan
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {monitoringPlans.map((plan) => (
            <Col key={plan.id}>
              <Card className="h-100 shadow-sm">
                {plan.image && (
                  <Card.Img variant="top" src={plan.image} alt={plan.title} style={{ height: '180px', objectFit: 'cover' }} />
                )}
                <Card.Body>
                  <Card.Title>{plan.title}</Card.Title>
                  <div className="mb-2">{getStatusBadge(plan.status)}</div>
                  <Card.Text className="text-muted">
                    {plan.description && plan.description.length > 120
                      ? `${plan.description.substring(0, 120)}...`
                      : plan.description}
                  </Card.Text>
                  <div className="small text-muted mb-3">
                    {plan.startDate && (
                      <div>
                        <strong>Start:</strong> {format(new Date(plan.startDate), 'MMM d, yyyy')}
                      </div>
                    )}
                    {plan.endDate && (
                      <div>
                        <strong>End:</strong> {format(new Date(plan.endDate), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-between">
                    <Link to={`/monitoring-plans/${plan.id}`} className="btn btn-sm btn-outline-primary">
                      <BsEye className="me-1" /> View
                    </Link>
                    <Link to={`/monitoring-plans/${plan.id}/dashboard`} className="btn btn-sm btn-outline-info">
                      <BsBarChart className="me-1" /> Dashboard
                    </Link>
                    <Link to={`/monitoring-plans/${plan.id}/edit`} className="btn btn-sm btn-outline-secondary">
                      <BsPencil className="me-1" /> Edit
                    </Link>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteClick(plan.id!)}
                    >
                      <BsTrash className="me-1" /> Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this monitoring plan? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MonitoringPlanList; 