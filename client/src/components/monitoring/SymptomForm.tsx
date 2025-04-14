import React from 'react';
import { FaTrash } from 'react-icons/fa';

// Enum for symptom data types
export enum SymptomDataType {
  NUMERIC = 'NUMERIC',
  BOOLEAN = 'BOOLEAN',
  SCALE = 'SCALE',
  ENUMERATION = 'ENUMERATION',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

// Interface for symptom template
export interface SymptomTemplate {
  id?: string;
  name: string;
  description: string;
  category: string;
  dataType: SymptomDataType;
  units?: string;
  minValue?: number;
  maxValue?: number;
  options?: Record<string, any>;
  isNew?: boolean;
  modified?: boolean;
}

interface SymptomFormProps {
  symptom: SymptomTemplate;
  index: number;
  onChange: (index: number, field: keyof SymptomTemplate, value: any) => void;
  onRemove: (index: number) => void;
  errors: Record<string, string>;
}

const SymptomForm: React.FC<SymptomFormProps> = ({ 
  symptom, 
  index, 
  onChange, 
  onRemove,
  errors
}) => {
  // Handle adding or removing an enumeration option
  const handleOptionChange = (optionIndex: number, value: string) => {
    const currentOptions = symptom.options?.items || [];
    const updatedOptions = [...currentOptions];
    updatedOptions[optionIndex] = value;
    
    onChange(index, 'options', { items: updatedOptions });
  };

  const addOption = () => {
    const currentOptions = symptom.options?.items || [];
    onChange(index, 'options', { items: [...currentOptions, ''] });
  };

  const removeOption = (optionIndex: number) => {
    const currentOptions = symptom.options?.items || [];
    onChange(
      index, 
      'options', 
      { items: currentOptions.filter((_, i) => i !== optionIndex) }
    );
  };

  // Common categories for symptom classification
  const commonCategories = [
    'Pain',
    'Mobility',
    'Appetite',
    'Energy',
    'Behavior',
    'Elimination',
    'Medication',
    'Vitals',
    'Physical Signs',
    'Other'
  ];

  return (
    <div className="border border-gray-200 rounded p-4 relative">
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        title="Remove symptom"
      >
        <FaTrash />
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Symptom Name */}
        <div>
          <label htmlFor={`symptom-${index}-name`} className="block text-sm font-medium text-gray-700">
            Symptom Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id={`symptom-${index}-name`}
            value={symptom.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors[`symptom[${index}].name`] ? 'border-red-500' : ''
            }`}
          />
          {errors[`symptom[${index}].name`] && (
            <p className="mt-1 text-sm text-red-500">{errors[`symptom[${index}].name`]}</p>
          )}
        </div>

        {/* Symptom Category */}
        <div>
          <label htmlFor={`symptom-${index}-category`} className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              id={`symptom-${index}-category`}
              value={symptom.category}
              onChange={(e) => onChange(index, 'category', e.target.value)}
              list={`categories-${index}`}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <datalist id={`categories-${index}`}>
              {commonCategories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Symptom Description */}
      <div className="mt-4">
        <label htmlFor={`symptom-${index}-description`} className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id={`symptom-${index}-description`}
          value={symptom.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Data Type Selection */}
      <div className="mt-4">
        <label htmlFor={`symptom-${index}-dataType`} className="block text-sm font-medium text-gray-700">
          Data Type <span className="text-red-500">*</span>
        </label>
        <select
          id={`symptom-${index}-dataType`}
          value={symptom.dataType}
          onChange={(e) => onChange(index, 'dataType', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value={SymptomDataType.NUMERIC}>Numeric (measurement)</option>
          <option value={SymptomDataType.BOOLEAN}>Yes/No (boolean)</option>
          <option value={SymptomDataType.SCALE}>Scale (1-10)</option>
          <option value={SymptomDataType.ENUMERATION}>Multiple Choice</option>
          <option value={SymptomDataType.TEXT}>Text (notes)</option>
          <option value={SymptomDataType.IMAGE}>Image Upload</option>
        </select>
      </div>

      {/* Type-specific configuration */}
      {symptom.dataType === SymptomDataType.NUMERIC && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor={`symptom-${index}-units`} className="block text-sm font-medium text-gray-700">
              Units
            </label>
            <input
              type="text"
              id={`symptom-${index}-units`}
              value={symptom.units || ''}
              onChange={(e) => onChange(index, 'units', e.target.value)}
              placeholder="e.g., kg, °C, bpm"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor={`symptom-${index}-minValue`} className="block text-sm font-medium text-gray-700">
              Minimum Value
            </label>
            <input
              type="number"
              id={`symptom-${index}-minValue`}
              value={symptom.minValue || ''}
              onChange={(e) => onChange(index, 'minValue', e.target.value === '' ? undefined : parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor={`symptom-${index}-maxValue`} className="block text-sm font-medium text-gray-700">
              Maximum Value
            </label>
            <input
              type="number"
              id={`symptom-${index}-maxValue`}
              value={symptom.maxValue || ''}
              onChange={(e) => onChange(index, 'maxValue', e.target.value === '' ? undefined : parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      )}

      {symptom.dataType === SymptomDataType.SCALE && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`symptom-${index}-minValue`} className="block text-sm font-medium text-gray-700">
              Minimum Value
            </label>
            <input
              type="number"
              id={`symptom-${index}-minValue`}
              value={symptom.minValue !== undefined ? symptom.minValue : 1}
              onChange={(e) => onChange(index, 'minValue', e.target.value === '' ? 1 : parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor={`symptom-${index}-maxValue`} className="block text-sm font-medium text-gray-700">
              Maximum Value
            </label>
            <input
              type="number"
              id={`symptom-${index}-maxValue`}
              value={symptom.maxValue !== undefined ? symptom.maxValue : 10}
              onChange={(e) => onChange(index, 'maxValue', e.target.value === '' ? 10 : parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      )}

      {symptom.dataType === SymptomDataType.ENUMERATION && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          
          {(symptom.options?.items || []).map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center mb-2">
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                placeholder={`Option ${optionIndex + 1}`}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => removeOption(optionIndex)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <FaTrash size={14} />
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addOption}
            className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Option
          </button>
        </div>
      )}
    </div>
  );
};

export default SymptomForm; 