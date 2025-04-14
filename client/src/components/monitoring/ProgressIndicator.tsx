import React, { useMemo } from 'react';
import { FaArrowUp, FaArrowDown, FaMinus, FaInfoCircle } from 'react-icons/fa';

export interface ProgressData {
  current: number;
  previous: number;
  target?: number;
  unit?: string;
  isInverted?: boolean; // For metrics where lower is better (e.g., pain levels)
}

export interface ProgressIndicatorProps {
  title: string;
  description?: string;
  data: ProgressData;
  className?: string;
  showPercentage?: boolean;
  thresholds?: {
    significant: number; // Percentage change considered significant
    moderate: number;    // Percentage change considered moderate
  };
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  title,
  description,
  data,
  className = '',
  showPercentage = true,
  thresholds = { significant: 15, moderate: 5 }
}) => {
  const { 
    changeValue, 
    changePercent, 
    changeDirection, 
    targetDifference, 
    targetPercent, 
    statusColor, 
    statusText,
    progressToTarget
  } = useMemo(() => {
    const { current, previous, target, isInverted = false } = data;
    
    // Calculate change
    const changeValue = current - previous;
    const changePercent = previous !== 0 
      ? Math.abs(Math.round((changeValue / previous) * 100)) 
      : 0;
    
    // Determine if change is positive or negative (accounting for inverted metrics)
    let actualDirection = changeValue > 0 ? 'increase' : changeValue < 0 ? 'decrease' : 'unchanged';
    let changeDirection = isInverted 
      ? (actualDirection === 'increase' ? 'decrease' : actualDirection === 'decrease' ? 'increase' : 'unchanged')
      : actualDirection;
    
    // Calculate target metrics if target is provided
    let targetDifference = 0;
    let targetPercent = 0;
    let progressToTarget = 0;
    
    if (target !== undefined) {
      targetDifference = current - target;
      targetPercent = target !== 0 
        ? Math.abs(Math.round((targetDifference / target) * 100)) 
        : 0;
      
      // Calculate progress to target (0-100%)
      if (isInverted) {
        // For inverted metrics (lower is better)
        const initialGap = previous - target;
        const currentGap = current - target;
        progressToTarget = initialGap <= 0 
          ? 100 // Already reached target
          : Math.max(0, Math.min(100, Math.round(((initialGap - currentGap) / initialGap) * 100)));
      } else {
        // For regular metrics (higher is better)
        const initialGap = target - previous;
        const currentGap = target - current;
        progressToTarget = initialGap <= 0 
          ? 100 // Already reached target
          : Math.max(0, Math.min(100, Math.round(((initialGap - currentGap) / initialGap) * 100)));
      }
    }
    
    // Determine status color and text
    let statusColor = 'text-gray-500';
    let statusText = 'Unchanged';
    
    if (changeDirection === 'increase') {
      if (changePercent >= thresholds.significant) {
        statusColor = 'text-green-600';
        statusText = 'Significant Improvement';
      } else if (changePercent >= thresholds.moderate) {
        statusColor = 'text-green-500';
        statusText = 'Moderate Improvement';
      } else {
        statusColor = 'text-green-400';
        statusText = 'Slight Improvement';
      }
    } else if (changeDirection === 'decrease') {
      if (changePercent >= thresholds.significant) {
        statusColor = 'text-red-600';
        statusText = 'Significant Decline';
      } else if (changePercent >= thresholds.moderate) {
        statusColor = 'text-red-500';
        statusText = 'Moderate Decline';
      } else {
        statusColor = 'text-red-400';
        statusText = 'Slight Decline';
      }
    }
    
    return { 
      changeValue, 
      changePercent, 
      changeDirection, 
      targetDifference, 
      targetPercent, 
      statusColor, 
      statusText,
      progressToTarget
    };
  }, [data, thresholds]);
  
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <div className="relative group">
            <FaInfoCircle className="text-gray-400 hover:text-gray-600 cursor-help" />
            <div className="hidden group-hover:block absolute right-0 w-64 p-2 bg-gray-100 border rounded shadow-lg text-xs text-gray-700 z-10">
              {description}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl font-bold">
            {data.current}{data.unit ? ` ${data.unit}` : ''}
          </span>
          
          <div className="ml-3 flex flex-col">
            <div className="flex items-center">
              {changeDirection === 'increase' ? (
                <FaArrowUp className="text-green-500 mr-1" />
              ) : changeDirection === 'decrease' ? (
                <FaArrowDown className="text-red-500 mr-1" />
              ) : (
                <FaMinus className="text-gray-500 mr-1" />
              )}
              
              <span className={`text-sm font-medium ${statusColor}`}>
                {showPercentage && changePercent > 0 ? `${changePercent}% ` : ''}
                {statusText}
              </span>
            </div>
            
            <span className="text-xs text-gray-500">
              Previous: {data.previous}{data.unit ? ` ${data.unit}` : ''}
            </span>
          </div>
        </div>
        
        {data.target !== undefined && (
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Target: {data.target}{data.unit ? ` ${data.unit}` : ''}
            </div>
            <div className="text-xs text-gray-500">
              {progressToTarget === 100 
                ? 'Target reached' 
                : `${progressToTarget}% to target`}
            </div>
          </div>
        )}
      </div>
      
      {/* Progress bar to target */}
      {data.target !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                progressToTarget >= 100 
                  ? 'bg-green-600' 
                  : progressToTarget >= 66 
                    ? 'bg-green-500' 
                    : progressToTarget >= 33 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
              }`}
              style={{ width: `${progressToTarget}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator; 