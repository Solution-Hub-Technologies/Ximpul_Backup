// Simple global state for notifications
let notifications = [];
let listeners = [];

export const notificationService = {
  // Add a notification
  addNotification: (notification) => {
    notifications = [notification, ...notifications];
    listeners.forEach(listener => listener(notifications));
  },
  
  // Get all notifications
  getNotifications: () => {
    return notifications;
  },
  
  // Clear all notifications
  clearNotifications: () => {
    notifications = [];
    listeners.forEach(listener => listener(notifications));
  },
  
  // Subscribe to notification changes
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};