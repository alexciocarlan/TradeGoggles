
import React from 'react';
import { useAppStore } from '../AppContext';
import { Notification, NotificationType } from '../types';

const NotificationCard: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
  let bgColor = 'bg-blue-600';
  let borderColor = 'border-blue-500';
  let textColor = 'text-white';
  let icon = 'fas fa-info-circle';

  switch (notification.type) {
    case 'success':
      bgColor = 'bg-emerald-600';
      borderColor = 'border-emerald-500';
      icon = 'fas fa-check-circle';
      break;
    case 'error':
      bgColor = 'bg-red-600';
      borderColor = 'border-red-500';
      icon = 'fas fa-exclamation-circle';
      break;
    case 'warning':
      bgColor = 'bg-orange-600';
      borderColor = 'border-orange-500';
      icon = 'fas fa-exclamation-triangle';
      break;
    case 'info':
    default:
      bgColor = 'bg-blue-600';
      borderColor = 'border-blue-500';
      icon = 'fas fa-info-circle';
      break;
  }

  return (
    <div
      className={`relative w-80 p-4 rounded-xl shadow-lg flex items-center space-x-3 transition-all duration-300 ease-out animate-in slide-in-from-right-full fade-in z-[500] ${bgColor} ${borderColor} border`}
      role="alert"
    >
      <i className={`${icon} ${textColor} text-xl flex-shrink-0`}></i>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${textColor}`}>{notification.message}</p>
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className={`p-1 rounded-full ${textColor} opacity-70 hover:opacity-100 transition-opacity flex-shrink-0`}
        aria-label="Dismiss notification"
      >
        <i className="fas fa-times text-xs"></i>
      </button>
    </div>
  );
};

const NotificationsDisplay: React.FC = () => {
  const notifications = useAppStore(state => state.notifications);
  const removeNotification = useAppStore(state => state.removeNotification);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-[500] space-y-4">
      {notifications.map(n => (
        <NotificationCard key={n.id} notification={n} onDismiss={removeNotification} />
      ))}
    </div>
  );
};

export default NotificationsDisplay;
