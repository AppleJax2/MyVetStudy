import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Notification type
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'study' | 'observation' | 'system' | 'result';
  date: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

const NotificationsPage: React.FC = () => {
  // Mock notifications data - would come from API in real app
  const initialNotifications: Notification[] = [
    {
      id: 'notif-1',
      title: 'New observation due',
      message: 'You have a weekly observation due for the Canine Arthritis Study by tomorrow.',
      type: 'observation',
      date: '2024-04-13T10:30:00Z',
      read: false,
      actionUrl: '/studies/study-1/symptoms',
      actionText: 'Record Observation'
    },
    {
      id: 'notif-2',
      title: 'Study update: Canine Arthritis Treatment Efficacy',
      message: 'The study coordinator has posted new instructions for the medication dosage. Please review before your next observation.',
      type: 'study',
      date: '2024-04-12T14:45:00Z',
      read: false,
      actionUrl: '/studies/study-1',
      actionText: 'View Study'
    },
    {
      id: 'notif-3',
      title: 'New study matches your interests',
      message: 'A new study on "Feline Nutrition Impact on Dental Health" has been posted that matches your interests in small animals.',
      type: 'system',
      date: '2024-04-10T09:15:00Z',
      read: true,
      actionUrl: '/studies/study-2',
      actionText: 'View Study'
    },
    {
      id: 'notif-4',
      title: 'Study results published',
      message: 'Results from the "Equine Exercise Recovery Methods" study you participated in have been published.',
      type: 'result',
      date: '2024-04-05T16:20:00Z',
      read: true,
      actionUrl: '/studies/study-3/results',
      actionText: 'View Results'
    },
    {
      id: 'notif-5',
      title: 'Platform update',
      message: 'MyVetStudy has been updated with new features for tracking study participation and managing observations.',
      type: 'system',
      date: '2024-04-01T08:00:00Z',
      read: true
    }
  ];

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'study':
        return (
          <div className="bg-blue-100 text-blue-600 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'observation':
        return (
          <div className="bg-yellow-100 text-yellow-600 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'result':
        return (
          <div className="bg-green-100 text-green-600 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 text-gray-600 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Format date/time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Filter notifications
  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : activeFilter === 'unread'
      ? notifications.filter(notif => !notif.read)
      : notifications.filter(notif => notif.type === activeFilter);

  // Count unread notifications
  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className="fade-in">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600">Stay updated on your research studies</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="btn-secondary text-sm"
          >
            Mark All as Read
          </button>
        )}
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button 
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 text-sm rounded-full ${
            activeFilter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button 
          onClick={() => setActiveFilter('unread')}
          className={`px-4 py-2 text-sm rounded-full ${
            activeFilter === 'unread' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button 
          onClick={() => setActiveFilter('study')}
          className={`px-4 py-2 text-sm rounded-full ${
            activeFilter === 'study' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Study Updates
        </button>
        <button 
          onClick={() => setActiveFilter('observation')}
          className={`px-4 py-2 text-sm rounded-full ${
            activeFilter === 'observation' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Observations
        </button>
        <button 
          onClick={() => setActiveFilter('result')}
          className={`px-4 py-2 text-sm rounded-full ${
            activeFilter === 'result' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Results
        </button>
      </div>
      
      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
          {filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-4 flex items-start gap-4 ${!notification.read ? 'bg-blue-50' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-grow">
                <div className="flex justify-between">
                  <h3 className={`font-medium ${!notification.read ? 'text-blue-800' : 'text-gray-800'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatDate(notification.date)}
                  </span>
                </div>
                
                <p className="text-gray-600 mt-1">
                  {notification.message}
                </p>
                
                {notification.actionUrl && notification.actionText && (
                  <div className="mt-2">
                    <Link 
                      to={notification.actionUrl} 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {notification.actionText} →
                    </Link>
                  </div>
                )}
              </div>
              
              {!notification.read && (
                <div className="flex-shrink-0">
                  <span className="block w-3 h-3 bg-blue-600 rounded-full"></span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No notifications found</h3>
          <p className="text-gray-600">
            {activeFilter === 'all' 
              ? "You don't have any notifications yet." 
              : `You don't have any ${activeFilter === 'unread' ? 'unread' : activeFilter} notifications.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 