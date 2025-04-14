import React, { useState } from 'react';
import AddHealthNoteForm from './AddHealthNoteForm';
import HealthNoteList from './HealthNoteList';

interface HealthHistoryTabProps {
  patientId: string;
  monitoringPlanPatientId: string;
}

const HealthHistoryTab: React.FC<HealthHistoryTabProps> = ({ patientId, monitoringPlanPatientId }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // This function will be called after a new note is successfully added
  const handleNoteAdded = () => {
    // Increment the refresh key to trigger a re-fetch in the HealthNoteList
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Health History</h2>
        <p className="text-gray-600 mb-4">
          Record and track health notes, observations, and updates for this patient.
        </p>
      </div>
      
      {/* Form to add new health notes */}
      <AddHealthNoteForm 
        patientId={patientId} 
        monitoringPlanPatientId={monitoringPlanPatientId}
        onSuccess={handleNoteAdded}
      />
      
      {/* List of existing health notes */}
      <div>
        <h3 className="text-lg font-medium mb-3">Health Notes History</h3>
        <HealthNoteList 
          patientId={patientId} 
          monitoringPlanPatientId={monitoringPlanPatientId} 
          refresh={refreshKey}
        />
      </div>
    </div>
  );
};

export default HealthHistoryTab; 