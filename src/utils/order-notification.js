// Direct order notification handler
import { addAdminNotification } from './admin-notification';

/**
 * Trigger a notification for a new order
 * This function is called directly from the test notifications page
 * and should be called when a new order is received
 */
export const triggerOrderNotification = (order) => {
  console.log('🔔 Triggering order notification for:', order);
  
  // Create a notification with order details
  addAdminNotification({
    title: 'New Order',
    message: `New order received from ${order.customer_name || 'Customer'}`,
    time: 'Just now',
    orderId: order.id
  });
  
  return true;
};