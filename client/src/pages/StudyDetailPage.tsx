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

const StudyDetailPage: React.FC = () => {
  const { studyId } = useParams<{ studyId: string }>();
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Mock data - in a real app, this would be fetched from an API
  const mockStudies: Study[] = [
    {
      id: 'study-1',
      title: 'Canine Arthritis Treatment Efficacy',
      description: 'Evaluating new treatments for canine arthritis in medium to large breeds.',
      detailedDescription: 'This study aims to compare the efficacy of three new treatments for canine arthritis in medium to large breed dogs. We will evaluate pain reduction, mobility improvement, and quality of life over a 6-month period. Owners will need to provide regular updates and attend monthly check-ups.',
      status: 'Active',
      category: 'Treatment',
      startDate: '2024-01-15',
      endDate: '2024-07-15',
      organizer: 'Veterinary Research Institute',
      participants: 120,
      maxParticipants: 150,
      eligibility: [
        'Dogs aged 5-12 years',
        'Medium to large breeds (20-50kg)',
        'Diagnosed with osteoarthritis',
        'No other major health conditions',
        'Not currently on other arthritis medication (washout period required)'
      ],
      requirements: [
        'Weekly online symptom reports',
        'Monthly in-person evaluations',
        'Administration of prescribed medication daily',
        'Before/after mobility videos',
        'Participation for the full 6-month period'
      ],
      benefits: [
        'Free arthritis medication for the study duration',
        'Free monthly check-ups and evaluations',
        'Contribution to advancing canine arthritis treatment',
        'Optional enrollment in follow-up studies'
      ],
      contactEmail: 'canine.arthritis@vetresearch.org',
      contactPhone: '555-123-4567',
      image: 'https://placehold.co/800x400/2563eb/ffffff?text=Canine+Arthritis+Study'
    },
    {
      id: 'study-2',
      title: 'Feline Nutrition Impact on Dental Health',
      description: 'Investigating the relationship between diet and dental health in domestic cats.',
      detailedDescription: 'This study will investigate how different diets affect feline dental health over time. We are comparing three specially formulated diets designed to reduce tartar buildup and improve overall dental health. Cats will be randomly assigned to one of three diet groups for the duration of the study.',
      status: 'Active',
      category: 'Nutrition',
      startDate: '2024-02-10',
      endDate: '2024-08-10',
      organizer: 'Feline Health Center',
      participants: 85,
      maxParticipants: 100,
      eligibility: [
        'Cats aged 2-10 years',
        'Indoor cats only',
        'No existing severe dental disease',
        'No other medical conditions requiring special diets',
        'Not currently on prescription dental diets'
      ],
      requirements: [
        'Exclusive feeding of provided study diet',
        'Monthly dental check-ups',
        'Before/after dental photos',
        'Weekly online updates about food acceptance',
        'Participation for the full 6-month period'
      ],
      benefits: [
        'Free premium cat food for the study duration',
        'Free dental evaluations and cleanings',
        'Dental health education for owners',
        'Contributing to improved feline dental health knowledge'
      ],
      contactEmail: 'feline.dental@felinehealth.org',
      contactPhone: '555-987-6543',
      image: 'https://placehold.co/800x400/2563eb/ffffff?text=Feline+Nutrition+Study'
    },
    {
      id: 'study-3',
      title: 'Equine Exercise Recovery Methods',
      description: 'Comparing different recovery protocols for performance horses after intensive exercise.',
      detailedDescription: 'This research compares the effectiveness of three different recovery protocols for performance horses following intensive exercise. We will measure physiological markers of recovery, performance metrics, and evaluate the impact on long-term health and performance sustainability.',
      status: 'Active',
      category: 'Sports Medicine',
      startDate: '2024-03-01',
      endDate: '2024-09-01',
      organizer: 'Equine Sports Research',
      participants: 45,
      maxParticipants: 60,
      eligibility: [
        'Performance horses aged 4-12 years',
        'Regular competition schedule',
        'No significant injuries in the past 6 months',
        'Consistent training regimen',
        'Owner/trainer willing to follow strict protocol'
      ],
      requirements: [
        'Implementation of assigned recovery protocol',
        'Bi-weekly performance testing',
        'Blood samples at specific intervals',
        'Detailed training and recovery logs',
        'Video documentation of recovery sessions'
      ],
      benefits: [
        'Advanced physiological monitoring',
        'Professional performance analysis',
        'Access to cutting-edge recovery techniques',
        'Detailed health and performance reports',
        'Contributing to equine sports medicine advancement'
      ],
      contactEmail: 'equine.recovery@sportsresearch.org',
      contactPhone: '555-456-7890',
      image: 'https://placehold.co/800x400/2563eb/ffffff?text=Equine+Exercise+Study'
    }
  ];

  useEffect(() => {
    // Simulate API call to fetch study details
    setLoading(true);
    try {
      setTimeout(() => {
        const foundStudy = mockStudies.find(s => s.id === studyId);
        if (foundStudy) {
          setStudy(foundStudy);
          // Check if user is already a participant (mock)
          setIsParticipant(localStorage.getItem(`participant_${studyId}`) === 'true');
        } else {
          setError('Study not found');
        }
        setLoading(false);
      }, 800); // Simulate network delay
    } catch (err) {
      setError('Error loading study details');
      setLoading(false);
    }
  }, [studyId]);

  const handleParticipate = () => {
    // In a real app, this would call an API
    localStorage.setItem(`participant_${studyId}`, 'true');
    setIsParticipant(true);
    
    // Update participant count (mock)
    if (study) {
      setStudy({
        ...study,
        participants: study.participants + 1
      });
    }
  };

  const handleWithdraw = () => {
    // In a real app, this would call an API
    localStorage.removeItem(`participant_${studyId}`);
    setIsParticipant(false);
    
    // Update participant count (mock)
    if (study) {
      setStudy({
        ...study,
        participants: Math.max(0, study.participants - 1)
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error || 'Study not found'}</span>
        <div className="mt-4">
          <Link to="/studies" className="btn-primary">
            Back to Studies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Study Header */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="h-64 bg-blue-600 relative">
          {study.image ? (
            <img src={study.image} alt={study.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white">
              <span className="text-2xl font-bold">{study.title}</span>
            </div>
          )}
          <div className="absolute top-4 right-4">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              study.status === 'Active' ? 'bg-green-100 text-green-800' :
              study.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {study.status}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{study.title}</h1>
              <p className="text-gray-600 mb-4">{study.description}</p>
            </div>
            <div className="mt-4 md:mt-0">
              {study.status === 'Active' && !isParticipant && (
                <button 
                  onClick={handleParticipate} 
                  className="btn-primary"
                >
                  Participate in Study
                </button>
              )}
              {study.status === 'Active' && isParticipant && (
                <button 
                  onClick={handleWithdraw} 
                  className="btn-secondary"
                >
                  Withdraw from Study
                </button>
              )}
              {study.status === 'Upcoming' && (
                <button className="btn-secondary">
                  Get Notified When Available
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm mt-6 text-gray-600">
            <div>
              <span className="font-medium">Organizer:</span> {study.organizer}
            </div>
            <div>
              <span className="font-medium">Category:</span> {study.category}
            </div>
            <div>
              <span className="font-medium">Timeline:</span> {new Date(study.startDate).toLocaleDateString()} - {new Date(study.endDate).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Participants:</span> {study.participants}{study.maxParticipants ? `/${study.maxParticipants}` : ''}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'details'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('eligibility')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'eligibility'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Eligibility
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'requirements'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Requirements
            </button>
            <button
              onClick={() => setActiveTab('benefits')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'benefits'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Benefits
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'contact'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Contact
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'details' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Study Details</h2>
              <p className="text-gray-700 mb-4">
                {study.detailedDescription || study.description}
              </p>
              
              {isParticipant && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Participation</h3>
                  <p className="text-gray-700 mb-4">
                    Thank you for participating in this study! You can track your progress and submit observations from your dashboard.
                  </p>
                  <Link 
                    to={`/studies/${study.id}/symptoms`}
                    className="btn-primary"
                  >
                    Record Symptoms/Observations
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'eligibility' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Eligibility Criteria</h2>
              {study.eligibility && study.eligibility.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {study.eligibility.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">No specific eligibility criteria provided.</p>
              )}
            </div>
          )}
          
          {activeTab === 'requirements' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Study Requirements</h2>
              {study.requirements && study.requirements.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {study.requirements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">No specific requirements provided.</p>
              )}
            </div>
          )}
          
          {activeTab === 'benefits' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Benefits for Participants</h2>
              {study.benefits && study.benefits.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {study.benefits.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">No specific benefits provided.</p>
              )}
            </div>
          )}
          
          {activeTab === 'contact' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
              <div className="space-y-3 text-gray-700">
                <p><span className="font-medium">Organizer:</span> {study.organizer}</p>
                {study.contactEmail && (
                  <p>
                    <span className="font-medium">Email:</span>{' '}
                    <a href={`mailto:${study.contactEmail}`} className="text-blue-600 hover:underline">
                      {study.contactEmail}
                    </a>
                  </p>
                )}
                {study.contactPhone && (
                  <p>
                    <span className="font-medium">Phone:</span>{' '}
                    <a href={`tel:${study.contactPhone}`} className="text-blue-600 hover:underline">
                      {study.contactPhone}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigate Back */}
      <div className="mt-6">
        <Link to="/studies" className="text-blue-600 hover:text-blue-800 font-medium">
          &larr; Back to All Studies
        </Link>
      </div>
    </div>
  );
};

export default StudyDetailPage; 