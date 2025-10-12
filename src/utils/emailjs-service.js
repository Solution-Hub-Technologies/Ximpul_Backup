// Email service with fallback to console logging
// Tries to send emails via server, falls back to console logging if server is not running

// Import the order notification utility (will be used when order emails are sent)
import { triggerOrderNotification } from './order-notification';

/**
 * Send an email using EmailJS
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email message
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const sendEmail = async (options) => {
  try {
    console.log('📧 Sending email to:', options.to);
    
    try {
      // Try to send the email via our local server
      // Use the current hostname but with port 3001 for the email server
      const emailServerUrl = `http://localhost:3001/send-email`;

      console.log('Using email server URL:', emailServerUrl);
      const response = await fetch(emailServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          message: options.message
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('%c Email sent successfully! ', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
        return { success: true, result };
      } else {
        throw new Error(result.error || 'Unknown error from email server');
      }
    } catch (serverError) {
      // Server not running or returned an error, fall back to console logging
      console.warn('Email server not available, falling back to console logging');
      
      // Log the email details
      console.log('%c EMAIL DETAILS ', 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Message:', options.message);
      
      // Return success since we logged it
      return { success: true, result: { status: 'logged' }, fallback: true };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

/**
 * Send order confirmation emails
 * @param {Object} order - Order data
 * @returns {Promise} - Promise that resolves when emails are sent
 */
export const sendOrderEmails = async (order) => {
  try {
    console.log('📧 Sending order emails for order:', order.id);
    
    try {
      // Try to send the order emails via our local server
      // Use the current hostname but with port 3001 for the email server
     const emailServerUrl = `http://localhost:3001/send-order-emails`;

      console.log('Using email server URL:', emailServerUrl);
      const response = await fetch(emailServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('%c Order emails sent successfully! ', 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;');
        
        // Note: Admin notification is handled separately in order success handler
        
        return { success: true, result };
      } else {
        throw new Error(result.error || 'Unknown error from email server');
      }
    } catch (serverError) {
      // Server not running or returned an error, fall back to sending individual emails
      console.warn('Email server not available, falling back to individual emails');
      
      const promises = [];
      
      // Send customer email if they provided an email
      if (order.customer_email) {
        const customerEmail = {
          to: order.customer_email,
          subject: `Thank You for Your Ximpul Flow Order #${order.order_id || order.id}`,
          message: `
Dear ${order.customer_name},

Thank you for choosing Ximpul Flow — a product built with care, purpose, and the belief that water should be free.

Your Order Details:
Order ID: #${order.order_id || order.id}
Product: ${order.selected_edition} Edition (${order.selected_color})
Total Amount: ${order.total_amount} BDT
Payment Method: ${order.payment_method || 'Not specified'}

By carrying your own bottle, you're not just staying hydrated —
You're joining a movement to end plastic waste.
You're making a bold choice for freedom, simplicity, and sustainability.
You're choosing #TruePrice — honest quality, no brand premium.

We are honored to have you with us on this journey.

Stay hydrated. Stay inspired. Stay original.
— Team Ximpul

Tagline:
💧 Your Water. Your Freedom.
          `
        };
        
        promises.push(sendEmail(customerEmail));
      }
      
      // Send admin emails to both addresses
      const adminEmails = [
        {
          to: 'ximpulshop@gmail.com',
          subject: `New Order: #${order.order_id || order.id}`,
          message: `
New Order Received!

Order ID: #${order.order_id || order.id}
UUID: ${order.id}
Customer: ${order.customer_name}
Phone: ${order.customer_phone}
Email: ${order.customer_email || 'Not provided'}
Product: ${order.selected_edition} Edition (${order.selected_color})
Payment Method: ${order.payment_method || 'Not specified'}
Total Amount: ${order.total_amount} BDT

Please check the admin dashboard for more details.
          `
        },
        {
          to: 'badhon@sohub.com.bd',
          subject: `New Ximpul Order: #${order.order_id || order.id}`,
          message: `
New Ximpul Order Received!

Order ID: #${order.order_id || order.id}
UUID: ${order.id}
Customer: ${order.customer_name}
Phone: ${order.customer_phone}
Email: ${order.customer_email || 'Not provided'}
Product: ${order.selected_edition} Edition (${order.selected_color})
Payment Method: ${order.payment_method || 'Not specified'}
Total Amount: ${order.total_amount} BDT

Please check the admin dashboard for more details.
          `
        }
      ];
      
      // Send admin emails with individual error handling
      console.log('📧 Sending admin emails to both addresses...');
      for (const email of adminEmails) {
        try {
          console.log(`📧 Sending admin email to: ${email.to}`);
          const result = await sendEmail(email);
          console.log(`📧 Email to ${email.to} result:`, result);
          promises.push(Promise.resolve(result));
        } catch (error) {
          console.error(`❌ Failed to send email to ${email.to}:`, error);
          promises.push(Promise.resolve({ success: false, error, email: email.to }));
        }
      }
      
      // Wait for all emails to be sent
      const results = await Promise.all(promises);
      
      return {
        success: results.every(r => r.success),
        results,
        fallback: true
      };
    }
  } catch (error) {
    console.error('Error sending order emails:', error);
    return { success: false, error };
  }
};