import React, { useEffect, useState } from 'react';
import { IHealthNote } from '../../types/health';
import { getHealthNotes } from '../../services/healthService';
import { format } from 'date-fns';

interface HealthNoteListProps {
  patientId: string;
  monitoringPlanPatientId: string;
  refresh?: number; // Increment to trigger refresh
}

const HealthNoteList: React.FC<HealthNoteListProps> = ({ 
  patientId, 
  monitoringPlanPatientId,
  refresh = 0 
}) => {
  const [notes, setNotes] = useState<IHealthNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getHealthNotes(patientId, monitoringPlanPatientId);
        setNotes(data);
      } catch (err) {
        console.error('Failed to fetch health notes:', err);
        setError('Unable to load health notes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [patientId, monitoringPlanPatientId, refresh]);

  if (loading) {
    return <div className="flex justify-center p-4">Loading health notes...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (notes.length === 0) {
    return <div className="text-gray-500 p-4">No health notes recorded yet.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {notes.map((note) => (
          <li key={note.id} className="p-4 hover:bg-gray-50">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-900">
                  {note.recordedBy ? `${note.recordedBy.firstName} ${note.recordedBy.lastName}` : 'Unknown User'}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(note.recordedAt), 'PPP p')}
                </span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.notes}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HealthNoteList; 