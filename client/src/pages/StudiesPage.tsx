import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Types for our study data
interface Study {
  id: string;
  title: string;
  description: string;
  status: 'Active' | 'Completed' | 'Upcoming';
  category: string;
  startDate: string;
  endDate: string;
  organizer: string;
  participants: number;
  image?: string;
}

const StudiesPage: React.FC = () => {
  // Mock data for studies
  const mockStudies: Study[] = [
    {
      id: 'study-1',
      title: 'Canine Arthritis Treatment Efficacy',
      description: 'Evaluating new treatments for canine arthritis in medium to large breeds.',
      status: 'Active',
      category: 'Treatment',
      startDate: '2024-01-15',
      endDate: '2024-07-15',
      organizer: 'Veterinary Research Institute',
      participants: 120,
      image: 'https://placehold.co/600x400/2563eb/ffffff?text=Canine+Arthritis'
    },
    {
      id: 'study-2',
      title: 'Feline Nutrition Impact on Dental Health',
      description: 'Investigating the relationship between diet and dental health in domestic cats.',
      status: 'Active',
      category: 'Nutrition',
      startDate: '2024-02-10',
      endDate: '2024-08-10',
      organizer: 'Feline Health Center',
      participants: 85,
      image: 'https://placehold.co/600x400/2563eb/ffffff?text=Feline+Nutrition'
    },
    {
      id: 'study-3',
      title: 'Equine Exercise Recovery Methods',
      description: 'Comparing different recovery protocols for performance horses after intensive exercise.',
      status: 'Active',
      category: 'Sports Medicine',
      startDate: '2024-03-01',
      endDate: '2024-09-01',
      organizer: 'Equine Sports Research',
      participants: 45,
      image: 'https://placehold.co/600x400/2563eb/ffffff?text=Equine+Exercise'
    },
    {
      id: 'study-4',
      title: 'Preventative Vaccines for Avian Influenza',
      description: 'Testing efficacy of new vaccines against emerging strains of avian influenza.',
      status: 'Upcoming',
      category: 'Vaccination',
      startDate: '2024-06-01',
      endDate: '2024-12-01',
      organizer: 'Avian Health Consortium',
      participants: 0,
      image: 'https://placehold.co/600x400/2563eb/ffffff?text=Avian+Vaccines'
    },
    {
      id: 'study-5',
      title: 'Long-term Effects of Antibiotics on Gut Microbiome',
      description: 'Studying the impacts of antibiotic treatments on digestive health in various species.',
      status: 'Completed',
      category: 'Microbiology',
      startDate: '2023-09-15',
      endDate: '2024-03-15',
      organizer: 'One Health Research Group',
      participants: 210,
      image: 'https://placehold.co/600x400/2563eb/ffffff?text=Microbiome+Research'
    },
  ];

  // State for filtering and search
  const [studies] = useState<Study[]>(mockStudies);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Filter studies based on search and filters
  const filteredStudies = studies.filter(study => {
    const matchesSearch = study.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          study.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || study.status === statusFilter;
    const matchesCategory = categoryFilter === '' || study.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter options
  const categories = Array.from(new Set(studies.map(study => study.category)));

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Veterinary Studies</h1>
        <p className="text-gray-600">Browse and participate in ongoing research studies</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="form-label">Search</label>
            <input
              type="text"
              id="search"
              className="form-input"
              placeholder="Search studies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="status" className="form-label">Status</label>
            <select
              id="status"
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label htmlFor="category" className="form-label">Category</label>
            <select
              id="category"
              className="form-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Studies Grid */}
      {filteredStudies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudies.map(study => (
            <div key={study.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-blue-600 overflow-hidden">
                {study.image ? (
                  <img src={study.image} alt={study.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white">
                    <span>{study.title}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-800 line-clamp-2">{study.title}</h2>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    study.status === 'Active' ? 'bg-green-100 text-green-800' :
                    study.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {study.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{study.description}</p>
                <div className="text-xs text-gray-500 mb-4">
                  <p><span className="font-medium">Category:</span> {study.category}</p>
                  <p><span className="font-medium">Duration:</span> {new Date(study.startDate).toLocaleDateString()} - {new Date(study.endDate).toLocaleDateString()}</p>
                  <p><span className="font-medium">Participants:</span> {study.participants}</p>
                </div>
                <Link 
                  to={`/studies/${study.id}`}
                  className="btn-primary text-sm inline-block"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No studies found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or check back later for new studies.</p>
        </div>
      )}
    </div>
  );
};

export default StudiesPage; 