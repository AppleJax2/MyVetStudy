import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { SymptomCategory, SymptomTemplate, SymptomDataType } from '../../types/monitoring-plan';

// Predefined common symptoms by category
const commonSymptoms: Record<SymptomCategory, Partial<SymptomTemplate>[]> = {
  [SymptomCategory.GENERAL]: [
    { name: 'Temperature', description: 'Body temperature reading', dataType: SymptomDataType.NUMERIC, units: '°C' },
    { name: 'Weight', description: 'Body weight measurement', dataType: SymptomDataType.NUMERIC, units: 'kg' },
    { name: 'Appetite', description: 'Appetite level', dataType: SymptomDataType.SCALE, minValue: 1, maxValue: 5 },
    { name: 'Energy Level', description: 'Overall energy/activity level', dataType: SymptomDataType.SCALE, minValue: 1, maxValue: 5 },
  ],
  [SymptomCategory.CARDIOVASCULAR]: [
    { name: 'Heart Rate', description: 'Heart rate measurement', dataType: SymptomDataType.NUMERIC, units: 'bpm' },
    { name: 'Pulse Quality', description: 'Quality of pulse', dataType: SymptomDataType.SCALE, minValue: 1, maxValue: 5 },
    { name: 'Mucous Membrane Color', description: 'Color of gums/mucous membranes', dataType: SymptomDataType.ENUMERATION },
  ],
  [SymptomCategory.RESPIRATORY]: [
    { name: 'Respiratory Rate', description: 'Breaths per minute', dataType: SymptomDataType.NUMERIC, units: 'breaths/min' },
    { name: 'Coughing', description: 'Presence and severity of coughing', dataType: SymptomDataType.SCALE, minValue: 0, maxValue: 5 },
    { name: 'Breathing Difficulty', description: 'Difficulty breathing', dataType: SymptomDataType.SCALE, minValue: 0, maxValue: 5 },
  ],
  [SymptomCategory.GASTROINTESTINAL]: [
    { name: 'Vomiting', description: 'Frequency of vomiting', dataType: SymptomDataType.NUMERIC, units: 'times/day' },
    { name: 'Diarrhea', description: 'Presence and severity of diarrhea', dataType: SymptomDataType.SCALE, minValue: 0, maxValue: 5 },
    { name: 'Stool Quality', description: 'Quality of stool', dataType: SymptomDataType.ENUMERATION },
  ],
  [SymptomCategory.NEUROLOGICAL]: [
    { name: 'Alertness', description: 'Level of alertness', dataType: SymptomDataType.SCALE, minValue: 1, maxValue: 5 },
    { name: 'Balance', description: 'Stability when walking', dataType: SymptomDataType.SCALE, minValue: 1, maxValue: 5 },
    { name: 'Seizure Activity', description: 'Presence and duration of seizures', dataType: SymptomDataType.TEXT },
  ],
  [SymptomCategory.MUSCULOSKELETAL]: [
    { name: 'Lameness', description: 'Degree of lameness', dataType: SymptomDataType.SCALE, minValue: 0, maxValue: 5 },
    { name: 'Joint Swelling', description: 'Presence and location of joint swelling', dataType: SymptomDataType.TEXT },
    { name: 'Mobility', description: 'Overall mobility', dataType: SymptomDataType.SCALE, minValue: 1, maxValue: 5 },
  ],
  [SymptomCategory.URINARY]: [
    { name: 'Urination Frequency', description: 'Frequency of urination', dataType: SymptomDataType.NUMERIC, units: 'times/day' },
    { name: 'Urination Volume', description: 'Volume of urine', dataType: SymptomDataType.SCALE, minValue: 1, maxValue: 5 },
    { name: 'Urine Color', description: 'Color of urine', dataType: SymptomDataType.ENUMERATION },
  ],
  [SymptomCategory.DERMATOLOGICAL]: [
    { name: 'Itching', description: 'Degree of itching', dataType: SymptomDataType.SCALE, minValue: 0, maxValue: 5 },
    { name: 'Skin Lesions', description: 'Presence and description of skin lesions', dataType: SymptomDataType.TEXT },
    { name: 'Skin Photo', description: 'Photo of skin condition', dataType: SymptomDataType.IMAGE },
  ],
  [SymptomCategory.BEHAVIORAL]: [
    { name: 'Anxiety', description: 'Level of anxiety', dataType: SymptomDataType.SCALE, minValue: 0, maxValue: 5 },
    { name: 'Aggression', description: 'Presence and context of aggression', dataType: SymptomDataType.TEXT },
    { name: 'Sleeping Pattern', description: 'Quality of sleep', dataType: SymptomDataType.SCALE, minValue: 1, maxValue: 5 },
  ],
  [SymptomCategory.NUTRITIONAL]: [
    { name: 'Food Intake', description: 'Amount of food eaten', dataType: SymptomDataType.SCALE, minValue: 0, maxValue: 5 },
    { name: 'Water Intake', description: 'Amount of water consumed', dataType: SymptomDataType.SCALE, minValue: 0, maxValue: 5 },
    { name: 'Diet Details', description: 'Details of diet', dataType: SymptomDataType.TEXT },
  ],
  [SymptomCategory.CUSTOM]: []
};

interface SymptomSelectorProps {
  onAdd: (symptom: SymptomTemplate) => void;
}

const SymptomSelector: React.FC<SymptomSelectorProps> = ({ onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory>(SymptomCategory.GENERAL);
  const [filteredSymptoms, setFilteredSymptoms] = useState<Partial<SymptomTemplate>[]>([]);

  useEffect(() => {
    // If search term is provided, filter across all categories
    if (searchTerm.trim()) {
      const allSymptoms = Object.values(commonSymptoms).flat();
      setFilteredSymptoms(
        allSymptoms.filter(symptom => 
          symptom.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          symptom.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      // Otherwise, show symptoms from selected category
      setFilteredSymptoms(commonSymptoms[selectedCategory]);
    }
  }, [searchTerm, selectedCategory]);

  const handleAddSymptom = (symptomTemplate: Partial<SymptomTemplate>) => {
    // Create a complete symptom template from the partial template
    const completeTemplate: SymptomTemplate = {
      name: symptomTemplate.name || '',
      description: symptomTemplate.description || '',
      category: selectedCategory,
      dataType: symptomTemplate.dataType || SymptomDataType.SCALE,
      units: symptomTemplate.units,
      minValue: symptomTemplate.minValue,
      maxValue: symptomTemplate.maxValue,
      options: symptomTemplate.options,
      isNew: true
    };
    
    onAdd(completeTemplate);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4">Add Symptom</h3>
      
      {/* Search bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search symptoms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      
      {/* Category selector */}
      {!searchTerm && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SymptomCategory)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {Object.values(SymptomCategory).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Symptom list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredSymptoms.length > 0 ? (
          filteredSymptoms.map((symptom, index) => (
            <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
              <div>
                <h4 className="font-medium text-sm">{symptom.name}</h4>
                <p className="text-xs text-gray-500">{symptom.description}</p>
                <p className="text-xs text-gray-400">
                  {symptom.dataType} {symptom.units ? `(${symptom.units})` : ''}
                </p>
              </div>
              <button
                onClick={() => handleAddSymptom(symptom)}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="Add symptom"
              >
                <FaPlus />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            {searchTerm ? "No symptoms found matching your search." : "No predefined symptoms in this category."}
          </div>
        )}
      </div>
      
      {/* Custom symptom button */}
      <div className="mt-4 text-center">
        <button
          onClick={() => onAdd({
            name: '',
            description: '',
            category: selectedCategory,
            dataType: SymptomDataType.SCALE,
            isNew: true
          })}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <FaPlus className="mr-2" /> Create Custom Symptom
        </button>
      </div>
    </div>
  );
};

export default SymptomSelector; 