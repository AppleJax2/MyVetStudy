import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaFilter, FaTimes, FaEdit, FaEye } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Patient interface
interface Patient {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  ownerName: string;
  isActive: boolean;
}

// Filter state interface
interface FilterState {
  species: string;
  status: 'active' | 'archived' | 'all';
  search: string;
}

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    species: '',
    status: 'active',
    search: '',
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        
        // Build query string
        const queryParams = new URLSearchParams();
        if (filters.species) queryParams.append('species', filters.species);
        if (filters.status !== 'all') queryParams.append('isActive', filters.status === 'active' ? 'true' : 'false');
        if (filters.search) queryParams.append('search', filters.search);
        
        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/patients${query}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }

        const data = await response.json();
        setPatients(data.data.patients);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast.error('Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    setFilters(prev => ({ ...prev, search: searchInput.value }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      species: '',
      status: 'active',
      search: '',
    });
    (document.getElementById('searchInput') as HTMLInputElement).value = '';
  };

  // List of common pet species for the filter dropdown
  const speciesList = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Guinea Pig', 'Reptile', 'Fish', 'Other'];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        
        <Link
          to="/patients/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="mr-2" /> Add New Patient
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex w-full md:w-auto">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                id="searchInput"
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                placeholder="Search by name, breed, or owner..."
                defaultValue={filters.search}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center py-2.5 px-3 ml-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300"
            >
              Search
            </button>
          </form>

          {/* Filter Toggle Button */}
          <div className="flex items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center py-2.5 px-3 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200"
            >
              <FaFilter className="mr-2" /> Filters
            </button>
            
            {(filters.species !== '' || filters.status !== 'active') && (
              <button
                onClick={clearFilters}
                className="ml-2 inline-flex items-center py-2.5 px-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 focus:ring-4 focus:outline-none focus:ring-red-300"
              >
                <FaTimes className="mr-2" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="species" className="block mb-2 text-sm font-medium text-gray-900">Species</label>
              <select
                id="species"
                name="species"
                value={filters.species}
                onChange={handleFilterChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <option value="">All Species</option>
                {speciesList.map(species => (
                  <option key={species} value={species}>{species}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status" className="block mb-2 text-sm font-medium text-gray-900">Status</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <option value="active">Active Only</option>
                <option value="archived">Archived Only</option>
                <option value="all">All Patients</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-700 mb-4">No patients found matching your criteria.</p>
          <div className="flex justify-center">
            <Link
              to="/patients/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" /> Add Your First Patient
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Species</th>
                <th scope="col" className="px-6 py-3 hidden md:table-cell">Breed</th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">Owner</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(patient => (
                <tr key={patient.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {patient.name}
                  </td>
                  <td className="px-6 py-4">{patient.species}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{patient.breed || 'N/A'}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">{patient.ownerName}</td>
                  <td className="px-6 py-4">
                    {patient.isActive ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Active</span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Archived</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Link
                        to={`/patients/${patient.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FaEye />
                      </Link>
                      <Link
                        to={`/patients/${patient.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Patient"
                      >
                        <FaEdit />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PatientsPage; 