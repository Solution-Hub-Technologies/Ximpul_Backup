import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ADMIN_ORDERS_URL = '/admin/orders';

/**
 * A component that listens for admin notifications and displays them
 */
export const NotificationListener = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleAdminNotification = (event: CustomEvent) => {
      try {
        if (event.detail?.notification) {
          const { title, message } = event.detail.notification;
          toast.success(title, {
            description: message,
            action: {
              label: 'View',
              onClick: () => navigate(ADMIN_ORDERS_URL)
            }
          });
        }
      } catch (error) {
        console.error('Error handling notification');
      }
    };
    
    window.showToast = (options) => {
      try {
        toast.success(options.title, {
          description: options.message,
          action: {
            label: 'View',
            onClick: () => navigate(ADMIN_ORDERS_URL)
          }
        });
      } catch (error) {
        console.error('Error showing toast');
      }
    };
    
    window.addEventListener('adminNotificationAdded', handleAdminNotification as EventListener);
    
    return () => {
      window.removeEventListener('adminNotificationAdded', handleAdminNotification as EventListener);
      delete window.showToast;
    };
  }, [navigate]);
  
  return null;
};

declare global {
  interface Window {
    showToast?: (options: { title: string; message: string; type?: string }) => void;
  }
}