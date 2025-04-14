import React, { useState } from 'react';
import { createHealthNote } from '../../services/healthService';

interface AddHealthNoteFormProps {
  patientId: string;
  monitoringPlanPatientId: string;
  onSuccess?: () => void;
}

const AddHealthNoteForm: React.FC<AddHealthNoteFormProps> = ({ 
  patientId, 
  monitoringPlanPatientId,
  onSuccess 
}) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notes.trim()) {
      setError('Please enter some notes.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      await createHealthNote(patientId, monitoringPlanPatientId, notes);
      setNotes(''); // Clear form after successful submission
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to create health note:', err);
      setError('Failed to save health note. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="text-lg font-medium mb-3">Add Health Note</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter health notes, observations, or updates about this patient..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        
        {error && (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddHealthNoteForm; 