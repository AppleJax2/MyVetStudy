import React, { useState } from 'react';
import { FaBell, FaInfoCircle } from 'react-icons/fa';

export interface ReminderConfig {
  enabled: boolean;
  methods: {
    email: boolean;
    push: boolean;
    sms?: boolean;
  };
  schedule: {
    sendBefore: number; // minutes before scheduled time
    missedDataReminder: boolean;
    reminderFrequency: 'once' | 'hourly' | 'daily';
  };
  message?: string;
  phoneNumber?: string;
  recipientIds?: string[]; // Additional recipients (staff members)
}

interface ReminderSettingsProps {
  config: ReminderConfig;
  onChange: (config: ReminderConfig) => void;
  showSmsOption?: boolean;
  className?: string;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({
  config,
  onChange,
  showSmsOption = false,
  className = ""
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleEnabled = () => {
    onChange({
      ...config,
      enabled: !config.enabled
    });
  };

  const handleMethodChange = (method: 'email' | 'push' | 'sms', checked: boolean) => {
    onChange({
      ...config,
      methods: {
        ...config.methods,
        [method]: checked
      }
    });
  };

  const handleScheduleChange = (field: keyof typeof config.schedule, value: any) => {
    onChange({
      ...config,
      schedule: {
        ...config.schedule,
        [field]: value
      }
    });
  };

  const handleMessageChange = (message: string) => {
    onChange({
      ...config,
      message
    });
  };

  const handlePhoneNumberChange = (phoneNumber: string) => {
    onChange({
      ...config,
      phoneNumber
    });
  };

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <FaBell className="mr-2 text-blue-500" /> Reminder Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure automatic reminders for monitoring submissions.
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6 space-y-6">
        {/* Main toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="reminder-enabled"
            checked={config.enabled}
            onChange={handleToggleEnabled}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="reminder-enabled" className="ml-2 block text-sm font-medium text-gray-700">
            Enable automatic reminders
          </label>
        </div>
        
        {config.enabled && (
          <>
            {/* Reminder Methods */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Reminder Methods</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reminder-email"
                    checked={config.methods.email}
                    onChange={(e) => handleMethodChange('email', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="reminder-email" className="ml-2 block text-sm text-gray-700">
                    Email notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reminder-push"
                    checked={config.methods.push}
                    onChange={(e) => handleMethodChange('push', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="reminder-push" className="ml-2 block text-sm text-gray-700">
                    Push notifications (requires app installation)
                  </label>
                </div>
                
                {showSmsOption && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reminder-sms"
                      checked={config.methods.sms}
                      onChange={(e) => handleMethodChange('sms', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="reminder-sms" className="ml-2 block text-sm text-gray-700">
                      SMS notifications
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            {/* SMS Configuration (if enabled) */}
            {showSmsOption && config.methods.sms && (
              <div>
                <label htmlFor="reminder-phone" className="block text-sm font-medium text-gray-700">
                  Phone Number for SMS
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    id="reminder-phone"
                    value={config.phoneNumber || ''}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    placeholder="+1 (123) 456-7890"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the phone number that should receive SMS reminders.
                  </p>
                </div>
              </div>
            )}
            
            {/* Show/Hide Advanced Settings */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
              </button>
            </div>
            
            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="send-before" className="block text-sm font-medium text-gray-700">
                    Send reminder before scheduled time
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <select
                      id="send-before"
                      value={config.schedule.sendBefore}
                      onChange={(e) => handleScheduleChange('sendBefore', parseInt(e.target.value))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value={0}>At scheduled time</option>
                      <option value={5}>5 minutes before</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                      <option value={60}>1 hour before</option>
                      <option value={120}>2 hours before</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="missed-data-reminder"
                    checked={config.schedule.missedDataReminder}
                    onChange={(e) => handleScheduleChange('missedDataReminder', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="missed-data-reminder" className="ml-2 block text-sm text-gray-700">
                    Send additional reminders for missed observations
                  </label>
                </div>
                
                {config.schedule.missedDataReminder && (
                  <div>
                    <label htmlFor="reminder-frequency" className="block text-sm font-medium text-gray-700">
                      Reminder frequency for missed observations
                    </label>
                    <select
                      id="reminder-frequency"
                      value={config.schedule.reminderFrequency}
                      onChange={(e) => handleScheduleChange('reminderFrequency', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="once">Once only</option>
                      <option value="hourly">Every hour</option>
                      <option value="daily">Once per day</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <label htmlFor="reminder-message" className="block text-sm font-medium text-gray-700">
                    Custom Reminder Message
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="reminder-message"
                      rows={3}
                      value={config.message || ''}
                      onChange={(e) => handleMessageChange(e.target.value)}
                      placeholder="Time to log your pet's symptoms!"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank to use the default message. The monitoring plan name and time will be automatically included.
                  </p>
                </div>
              </div>
            )}
            
            {/* Info Section */}
            <div className="mt-4 bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaInfoCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">About reminders</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Reminders help ensure monitoring data is submitted on time. For more advanced notification settings, 
                      visit the Practice Settings page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReminderSettings; 