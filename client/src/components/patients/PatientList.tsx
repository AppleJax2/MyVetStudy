import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import { getPatients, deletePatient, Patient } from '../../services/patientService';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(
        patient =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const data = await getPatients();
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      toast.error('Failed to fetch patients');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setPatientToDelete(id);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    
    try {
      await deletePatient(patientToDelete);
      toast.success('Patient deleted successfully');
      setPatients(patients.filter(patient => patient.id !== patientToDelete));
    } catch (error) {
      toast.error('Failed to delete patient');
      console.error(error);
    } finally {
      setShowConfirmDialog(false);
      setPatientToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setPatientToDelete(null);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Patients</h1>
        <Link 
          to="/patients/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <FaPlus className="mr-2" /> Add New Patient
        </Link>
      </div>
      
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search patients by name, species, breed, or owner..."
          className="pl-10 p-2 border border-gray-300 rounded w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center p-4 border border-gray-200 rounded">
          {searchTerm ? 'No patients match your search.' : 'No patients yet. Add your first patient!'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Species</th>
                <th className="py-2 px-4 text-left">Breed</th>
                <th className="py-2 px-4 text-left">Gender</th>
                <th className="py-2 px-4 text-left">Owner</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-4">
                    <Link to={`/patients/${patient.id}`} className="text-blue-500 hover:underline">
                      {patient.name}
                    </Link>
                  </td>
                  <td className="py-2 px-4">{patient.species}</td>
                  <td className="py-2 px-4">{patient.breed}</td>
                  <td className="py-2 px-4">{patient.gender}</td>
                  <td className="py-2 px-4">{patient.ownerName}</td>
                  <td className="py-2 px-4">
                    <span 
                      className={`px-2 py-1 rounded text-xs ${
                        patient.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : patient.status === 'Inactive' 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {patient.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex justify-end">
                      <Link 
                        to={`/patients/${patient.id}/edit`} 
                        className="text-blue-500 hover:text-blue-700 mr-3"
                        title="Edit Patient"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(patient.id as string)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete Patient"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirm Delete"
        message="Are you sure you want to delete this patient? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default PatientList; 