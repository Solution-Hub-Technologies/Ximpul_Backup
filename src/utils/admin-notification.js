// Admin-only notification service

// Sanitize input to prevent log injection
const sanitizeForLog = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[\r\n\t]/g, ' ').substring(0, 200);
};

// Batch localStorage operations for better performance
const updateNotificationStorage = (notifications) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  const updates = {
    adminNotifications: JSON.stringify(notifications),
    adminNotificationsUnreadCount: unreadCount.toString(),
    adminNotificationsUpdated: Date.now().toString()
  };
  
  Object.entries(updates).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
};

/**
 * Add a notification for admin users
 */
export const addAdminNotification = (notification) => {
  try {
    // Sanitize notification data
    const newNotification = {
      id: notification.orderId || `notification-${Date.now()}`,
      title: sanitizeForLog(notification.title),
      message: sanitizeForLog(notification.message),
      type: 'order',
      data: { id: notification.orderId },
      read: false,
      createdAt: new Date().toISOString()
    };
    
    // Get existing notifications and update storage
    const storedNotifications = localStorage.getItem('adminNotifications') || '[]';
    const notifications = JSON.parse(storedNotifications);
    notifications.unshift(newNotification);
    
    // Batch localStorage updates
    updateNotificationStorage(notifications);
    
    // Show toast and dispatch event
    if (window.showToast) {
      window.showToast({
        title: newNotification.title,
        message: newNotification.message,
        type: 'success'
      });
    }
    
    const event = new CustomEvent('adminNotificationAdded', { 
      detail: { notification: newNotification } 
    });
    window.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error('Error adding notification');
    return false;
  }
};

/**
 * Get all admin notifications
 */
export const getAdminNotifications = () => {
  try {
    const storedNotifications = localStorage.getItem('adminNotifications') || '[]';
    return JSON.parse(storedNotifications);
  } catch (error) {
    console.error('Error getting notifications');
    return [];
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = () => {
  try {
    const notifications = getAdminNotifications();
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    return 0;
  }
};

/**
 * Mark all notifications as read
 */
export const markNotificationsAsRead = () => {
  try {
    const storedNotifications = localStorage.getItem('adminNotifications') || '[]';
    const notifications = JSON.parse(storedNotifications);
    
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    updateNotificationStorage(updatedNotifications);
    
    const event = new CustomEvent('adminNotificationsRead');
    window.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error('Error marking notifications as read');
    return false;
  }
};

/**
 * Clear all admin notifications
 */
export const clearAdminNotifications = () => {
  try {
    updateNotificationStorage([]);
    
    const event = new CustomEvent('adminNotificationsCleared');
    window.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error('Error clearing notifications');
    return false;
  }
};