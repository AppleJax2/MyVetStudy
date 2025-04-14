import React, { useState, useEffect, useRef } from 'react';
import { FaCalendarAlt, FaSearch, FaSearchMinus, FaSearchPlus } from 'react-icons/fa';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';

// Types for timeline data
export interface TimelineEvent {
  id: string;
  date: string; // ISO date string
  value: number | boolean | string;
  notes?: string;
  type: 'observation' | 'medication' | 'treatment' | 'note';
  category?: string;
  severity?: 'low' | 'medium' | 'high';
  source?: string;
}

interface TimelineVisualizationProps {
  title: string;
  description?: string;
  events: TimelineEvent[];
  initialTimeRange?: number; // Days to show initially
  minTimeRange?: number; // Minimum days to show when zoomed in
  maxTimeRange?: number; // Maximum days to show when zoomed out
  onEventClick?: (event: TimelineEvent) => void;
  className?: string;
}

const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  title,
  description,
  events,
  initialTimeRange = 30,
  minTimeRange = 7,
  maxTimeRange = 365,
  onEventClick,
  className = ''
}) => {
  const [timeRange, setTimeRange] = useState<number>(initialTimeRange);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>(events);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Sort events by date and filter based on search term
  useEffect(() => {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const filtered = searchTerm
      ? sortedEvents.filter(event => 
          event.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (typeof event.value === 'string' && event.value.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : sortedEvents;
    
    setFilteredEvents(filtered);
  }, [events, searchTerm]);

  // Get the date range for the timeline
  const getDateRange = () => {
    const endDate = selectedDate;
    const startDate = subDays(endDate, timeRange);
    return { startDate, endDate };
  };

  // Filter events within the visible date range
  const getVisibleEvents = () => {
    const { startDate, endDate } = getDateRange();
    return filteredEvents.filter(event => {
      const eventDate = parseISO(event.date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  };

  // Handle zooming in and out
  const handleZoomIn = () => {
    setTimeRange(prev => Math.max(prev / 2, minTimeRange));
  };

  const handleZoomOut = () => {
    setTimeRange(prev => Math.min(prev * 2, maxTimeRange));
  };

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
  };

  // Handle event click
  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Get event style based on type and severity
  const getEventStyle = (event: TimelineEvent) => {
    let bgColor = 'bg-blue-500';
    let textColor = 'text-white';
    
    switch (event.type) {
      case 'observation':
        bgColor = event.severity === 'high' 
          ? 'bg-red-500' 
          : event.severity === 'medium' 
            ? 'bg-orange-500' 
            : 'bg-yellow-500';
        break;
      case 'medication':
        bgColor = 'bg-green-500';
        break;
      case 'treatment':
        bgColor = 'bg-purple-500';
        break;
      case 'note':
        bgColor = 'bg-gray-500';
        break;
    }
    
    return `${bgColor} ${textColor}`;
  };

  // Convert date to position on timeline
  const getEventPosition = (eventDate: Date) => {
    const { startDate, endDate } = getDateRange();
    const totalDays = differenceInDays(endDate, startDate) || 1;
    const daysFromStart = differenceInDays(eventDate, startDate);
    
    // Return percentage position (0-100%)
    return Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
  };

  // Group events by date
  const getGroupedEvents = () => {
    const grouped: Record<string, TimelineEvent[]> = {};
    
    getVisibleEvents().forEach(event => {
      const dateKey = format(parseISO(event.date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    return grouped;
  };

  // Get date markers for the timeline
  const getDateMarkers = () => {
    const { startDate, endDate } = getDateRange();
    const totalDays = differenceInDays(endDate, startDate);
    
    // Determine appropriate interval for date markers based on time range
    let interval = 1;
    if (totalDays > 60) interval = 7;
    if (totalDays > 180) interval = 30;
    
    const markers = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      markers.push({
        date: new Date(currentDate),
        position: getEventPosition(currentDate)
      });
      
      // Add days based on interval
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + interval);
    }
    
    return markers;
  };

  const visibleEvents = getVisibleEvents();
  const dateMarkers = getDateMarkers();
  const groupedEvents = getGroupedEvents();
  const { startDate, endDate } = getDateRange();

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        
        <div className="flex space-x-2">
          {/* Zoom controls */}
          <button 
            onClick={handleZoomIn}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Zoom in"
          >
            <FaSearchPlus />
          </button>
          <button 
            onClick={handleZoomOut}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            title="Zoom out"
          >
            <FaSearchMinus />
          </button>
          
          {/* Date selector */}
          <div className="relative flex items-center">
            <FaCalendarAlt className="absolute left-2 text-gray-400" />
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="pl-8 pr-2 py-1 border rounded text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Search */}
      <div className="mb-4 relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
        />
      </div>
      
      {/* Timeline header with date range */}
      <div className="text-sm text-gray-500 flex justify-between mb-2">
        <span>{format(startDate, 'MMM d, yyyy')}</span>
        <span>Showing {timeRange} days</span>
        <span>{format(endDate, 'MMM d, yyyy')}</span>
      </div>
      
      {/* Main timeline */}
      <div className="relative mb-6" style={{ height: '150px' }} ref={timelineRef}>
        {/* Timeline track */}
        <div className="absolute w-full h-1 bg-gray-200 top-6"></div>
        
        {/* Date markers */}
        {dateMarkers.map((marker, index) => (
          <div
            key={`marker-${index}`}
            className="absolute w-px h-3 bg-gray-400 top-4"
            style={{ left: `${marker.position}%` }}
          >
            <div className="text-xs text-gray-500 mt-3 transform -translate-x-1/2">
              {format(marker.date, 'MMM d')}
            </div>
          </div>
        ))}
        
        {/* Timeline events */}
        {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => {
          const date = parseISO(dateKey);
          const position = getEventPosition(date);
          
          return (
            <div
              key={`date-${dateKey}`}
              className="absolute"
              style={{ left: `${position}%`, top: '20px' }}
            >
              <div className="relative">
                <div 
                  className="w-2 h-2 rounded-full bg-gray-600 mb-1 transform -translate-x-1/2"
                ></div>
                
                {/* Stacked events for this date */}
                <div className="flex flex-col items-center absolute transform -translate-x-1/2" style={{ width: '120px' }}>
                  {dateEvents.map((event, eventIndex) => (
                    <div
                      key={`event-${event.id || eventIndex}`}
                      className={`text-xs p-1 mb-1 rounded truncate w-full text-center cursor-pointer ${getEventStyle(event)}`}
                      onClick={() => handleEventClick(event)}
                      title={typeof event.value === 'string' ? event.value : event.notes || ''}
                    >
                      {event.category || event.type}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Selected event details */}
      {selectedEvent && (
        <div className="border-t pt-3 mt-2">
          <div className="text-sm font-medium text-gray-900">
            {format(parseISO(selectedEvent.date), 'MMMM d, yyyy')} - {selectedEvent.category || selectedEvent.type}
          </div>
          <div className="text-sm text-gray-700 mt-1">
            Value: {typeof selectedEvent.value === 'boolean' 
              ? (selectedEvent.value ? 'Yes' : 'No') 
              : selectedEvent.value}
          </div>
          {selectedEvent.notes && (
            <div className="text-sm text-gray-600 mt-1">
              Notes: {selectedEvent.notes}
            </div>
          )}
          {selectedEvent.source && (
            <div className="text-xs text-gray-500 mt-1">
              Source: {selectedEvent.source}
            </div>
          )}
        </div>
      )}
      
      {/* Empty state */}
      {visibleEvents.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          {filteredEvents.length === 0 
            ? 'No timeline events available' 
            : searchTerm 
              ? 'No events match your search' 
              : 'No events in the selected date range'}
        </div>
      )}
    </div>
  );
};

export default TimelineVisualization; 