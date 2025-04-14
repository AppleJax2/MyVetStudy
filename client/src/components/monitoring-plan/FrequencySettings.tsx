import React, { useState } from 'react';
import { FaPlus, FaTrash, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { MonitoringPlanProtocol } from '../../types/monitoring-plan';

interface FrequencySettingsProps {
  protocol: MonitoringPlanProtocol;
  onChange: (protocol: MonitoringPlanProtocol) => void;
}

const FrequencySettings: React.FC<FrequencySettingsProps> = ({ protocol, onChange }) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Create a deep copy to avoid mutating the props directly
  const updateProtocol = (updates: Partial<MonitoringPlanProtocol>) => {
    onChange({ ...protocol, ...updates });
  };
  
  // Handle specific time of day additions
  const addTimeOfDay = () => {
    const times = protocol.specificTimeOfDay || [];
    onChange({
      ...protocol,
      specificTimeOfDay: [...times, '08:00']
    });
  };
  
  const updateTimeOfDay = (index: number, value: string) => {
    if (!protocol.specificTimeOfDay) return;
    
    const times = [...protocol.specificTimeOfDay];
    times[index] = value;
    onChange({
      ...protocol,
      specificTimeOfDay: times
    });
  };
  
  const removeTimeOfDay = (index: number) => {
    if (!protocol.specificTimeOfDay) return;
    
    const times = [...protocol.specificTimeOfDay];
    times.splice(index, 1);
    onChange({
      ...protocol,
      specificTimeOfDay: times
    });
  };
  
  // Handle days of week selection
  const toggleDayOfWeek = (day: number) => {
    const currentDays = protocol.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    onChange({
      ...protocol,
      daysOfWeek: newDays
    });
  };
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="space-y-6">
      {/* Basic Frequency Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="frequency.times" className="block text-sm font-medium text-gray-700">
            Frequency
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="frequency.times"
              min={1}
              value={protocol.frequency.times}
              onChange={(e) => updateProtocol({
                frequency: {
                  ...protocol.frequency,
                  times: parseInt(e.target.value) || 1
                }
              })}
              className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <select
              value={protocol.frequency.period}
              onChange={(e) => updateProtocol({
                frequency: {
                  ...protocol.frequency,
                  period: e.target.value as 'DAY' | 'WEEK' | 'MONTH'
                }
              })}
              className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="DAY">per day</option>
              <option value="WEEK">per week</option>
              <option value="MONTH">per month</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration (days)
          </label>
          <input
            type="number"
            id="duration"
            min={1}
            value={protocol.duration}
            onChange={(e) => updateProtocol({ duration: parseInt(e.target.value) || 1 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Advanced Settings Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
        >
          {showAdvancedSettings ? 'Hide' : 'Show'} advanced frequency settings
        </button>
      </div>
      
      {showAdvancedSettings && (
        <div className="bg-gray-50 p-4 rounded-md space-y-4">
          {/* Specific Times of Day */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <FaClock className="inline mr-1" /> Specific Times of Day
              </label>
              <button
                type="button"
                onClick={addTimeOfDay}
                className="text-blue-600 hover:text-blue-800"
              >
                <FaPlus size={14} />
              </button>
            </div>
            
            {protocol.specificTimeOfDay && protocol.specificTimeOfDay.length > 0 ? (
              <div className="space-y-2">
                {protocol.specificTimeOfDay.map((time, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTimeOfDay(index, e.target.value)}
                      className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeTimeOfDay(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-1">
                  These times will be used for reminders (if enabled) and data collection prompts.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No specific times set. Monitoring will occur at any time of day.
              </p>
            )}
          </div>
          
          {/* Days of Week (for weekly schedules) */}
          {protocol.frequency.period === 'WEEK' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-1" /> Days of the Week
              </label>
              <div className="flex flex-wrap gap-2">
                {dayNames.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDayOfWeek(index)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      protocol.daysOfWeek?.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select which days of the week to monitor symptoms.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Reminders */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="reminderEnabled"
          checked={protocol.reminderEnabled}
          onChange={(e) => updateProtocol({ reminderEnabled: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="reminderEnabled" className="ml-2 block text-sm text-gray-700">
          Enable reminders for symptom logging
        </label>
      </div>
    </div>
  );
};

export default FrequencySettings; 