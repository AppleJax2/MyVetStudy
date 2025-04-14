import React from 'react';
import { FaClock, FaCalendarAlt, FaCalendarDay } from 'react-icons/fa';

// Protocol types
export interface FrequencyProtocol {
  frequency: {
    times: number;
    period: 'DAY' | 'WEEK' | 'MONTH';
  };
  duration: number; // in days
  reminderEnabled: boolean;
  shareableLink: boolean;
  timeSlots?: string[]; // Times of day for reminders
  weeklyDays?: number[]; // Days of week (0-6, where 0 is Sunday)
  monthlyDays?: number[]; // Days of month (1-31)
}

interface FrequencySettingsProps {
  protocol: FrequencyProtocol;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const FrequencySettings: React.FC<FrequencySettingsProps> = ({ 
  protocol, 
  onChange, 
  errors 
}) => {
  // Handles time-of-day selection for monitoring
  const [timeSlots, setTimeSlots] = React.useState<string[]>(
    protocol.frequency.times > 0 ? 
      Array(protocol.frequency.times).fill('').map((_, i) => protocol.timeSlots?.[i] || '09:00') : 
      []
  );

  // Update frequency times 
  const handleFrequencyTimesChange = (value: number) => {
    const newValue = Math.max(1, value); // Ensure at least 1
    onChange('frequency.times', newValue);
    
    // Adjust time slots array to match the new number of times
    if (newValue > timeSlots.length) {
      // Add more time slots if needed
      setTimeSlots([...timeSlots, ...Array(newValue - timeSlots.length).fill('09:00')]);
    } else if (newValue < timeSlots.length) {
      // Remove excess time slots
      setTimeSlots(timeSlots.slice(0, newValue));
    }
  };

  // Update time slot
  const handleTimeSlotChange = (index: number, value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index] = value;
    setTimeSlots(newTimeSlots);
    
    // Update the protocol with the new time slots
    onChange('timeSlots', newTimeSlots);
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Monitoring Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Define how often symptoms should be monitored and for how long.
        </p>
      </div>
      <div className="px-4 py-5 sm:p-6 space-y-6">
        {/* Frequency Section */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-500" /> Monitoring Frequency
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="frequency-times" className="block text-sm font-medium text-gray-700">
                Times per Period
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  id="frequency-times"
                  min={1}
                  value={protocol.frequency.times}
                  onChange={(e) => handleFrequencyTimesChange(parseInt(e.target.value))}
                  className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <select
                  value={protocol.frequency.period}
                  onChange={(e) => onChange('frequency.period', e.target.value)}
                  className="block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="DAY">per day</option>
                  <option value="WEEK">per week</option>
                  <option value="MONTH">per month</option>
                </select>
              </div>
              {errors['frequency.times'] && (
                <p className="mt-1 text-sm text-red-500">{errors['frequency.times']}</p>
              )}
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
                onChange={(e) => onChange('duration', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors['duration'] && (
                <p className="mt-1 text-sm text-red-500">{errors['duration']}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Time of Day for Daily Monitoring */}
        {protocol.frequency.period === 'DAY' && protocol.frequency.times > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
              <FaClock className="mr-2 text-blue-500" /> Preferred Time of Day
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {timeSlots.map((timeSlot, index) => (
                <div key={index}>
                  <label 
                    htmlFor={`time-slot-${index}`} 
                    className="block text-sm font-medium text-gray-700"
                  >
                    Time {index + 1}
                  </label>
                  <input
                    type="time"
                    id={`time-slot-${index}`}
                    value={timeSlot}
                    onChange={(e) => handleTimeSlotChange(index, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              These times will be used to schedule reminders (if enabled).
            </p>
          </div>
        )}
        
        {/* Schedule for Weekly or Monthly */}
        {protocol.frequency.period !== 'DAY' && protocol.frequency.times > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
              <FaCalendarDay className="mr-2 text-blue-500" /> 
              {protocol.frequency.period === 'WEEK' ? 'Days of Week' : 'Days of Month'}
            </h4>
            
            <p className="text-sm text-gray-500 mb-3">
              Configure the specific {protocol.frequency.period === 'WEEK' ? 'days of the week' : 'days of the month'} 
              for monitoring.
            </p>
            
            {protocol.frequency.period === 'WEEK' && (
              <div className="flex flex-wrap gap-2">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      protocol.weeklyDays?.includes(index) ? 
                        'bg-blue-100 text-blue-800 border border-blue-300' : 
                        'bg-gray-50 text-gray-800 border border-gray-300'
                    }`}
                    onClick={() => {
                      const currentDays = protocol.weeklyDays || [];
                      const newDays = currentDays.includes(index) 
                        ? currentDays.filter((d: number) => d !== index)
                        : [...currentDays, index];
                      
                      // Ensure we don't exceed the frequency.times value
                      if (newDays.length <= protocol.frequency.times) {
                        onChange('weeklyDays', newDays);
                      }
                    }}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            )}
            
            {protocol.frequency.period === 'MONTH' && (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    type="button"
                    className={`w-10 h-10 rounded-md text-sm font-medium ${
                      protocol.monthlyDays?.includes(day) ? 
                        'bg-blue-100 text-blue-800 border border-blue-300' : 
                        'bg-gray-50 text-gray-800 border border-gray-300'
                    }`}
                    onClick={() => {
                      const currentDays = protocol.monthlyDays || [];
                      const newDays = currentDays.includes(day) 
                        ? currentDays.filter((d: number) => d !== day)
                        : [...currentDays, day];
                      
                      // Ensure we don't exceed the frequency.times value
                      if (newDays.length <= protocol.frequency.times) {
                        onChange('monthlyDays', newDays);
                      }
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Additional Settings */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Additional Settings</h4>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="reminderEnabled"
                checked={protocol.reminderEnabled}
                onChange={(e) => onChange('reminderEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="reminderEnabled" className="ml-2 block text-sm text-gray-700">
                Enable reminders for symptom logging
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="shareableLink"
                checked={protocol.shareableLink}
                onChange={(e) => onChange('shareableLink', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="shareableLink" className="ml-2 block text-sm text-gray-700">
                Generate shareable link for this monitoring plan
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrequencySettings; 