import React from 'react';
import Layout from '../components/Layout';
import MonitoringPlanList from '../components/MonitoringPlanList';
import { Container } from 'react-bootstrap';

const MonitoringPlanListPage: React.FC = () => {
  return (
    <Layout>
      <Container className="py-4">
        <MonitoringPlanList />
      </Container>
    </Layout>
  );
};

export default MonitoringPlanListPage; 