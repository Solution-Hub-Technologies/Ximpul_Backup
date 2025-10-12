import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Create context with default values
const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {}
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription for new orders
    const subscription = supabase
      .channel('public:orders')
      .on('INSERT', payload => {
        const newOrder = payload.new;
        addNotification({
          id: newOrder.id,
          title: 'New Order',
          message: `New order from ${newOrder.customer_name}`,
          type: 'order',
          data: newOrder,
          read: false,
          createdAt: new Date().toISOString()
        });
        
        // Show toast notification
        toast.success(`New order received from ${newOrder.customer_name}!`, {
          action: {
            label: 'View',
            onClick: () => window.location.href = '/admin/orders'
          }
        });
      })
      .subscribe();
    
    // Listen for custom notification events
    const handleCustomNotification = (event: any) => {
      console.log('Custom notification event received:', event.detail);
      if (event.detail && event.detail.notification) {
        addNotification(event.detail.notification);
        
        // Show toast notification
        toast.success(event.detail.notification.title, {
          description: event.detail.notification.message,
          action: {
            label: 'View',
            onClick: () => window.location.href = '/admin/orders'
          }
        });
      }
    };
    
    window.addEventListener('adminNotificationAdded', handleCustomNotification);
      
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('adminNotificationAdded', handleCustomNotification);
    };
  }, []);
  
  // Force refresh notifications from localStorage periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Fetch notifications from local storage or API
  const fetchNotifications = () => {
    try {
      const storedNotifications = localStorage.getItem('adminNotifications');
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
        setUnreadCount(parsedNotifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Add a new notification
  const addNotification = (notification: any) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      localStorage.setItem('adminNotifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => prev + 1);
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem('adminNotifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('adminNotifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('adminNotifications');
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);