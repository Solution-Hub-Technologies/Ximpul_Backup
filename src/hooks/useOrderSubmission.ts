import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { triggerOrderNotification } from '@/utils/order-notification';
import { sendOrderEmails } from '@/utils/emailjs-service';
import { sendEmail } from '@/utils/send-email';

interface OrderData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  selectedEdition: string;
  selectedColor: string;
  selectedAccessories: string[];
  engravingText: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  privacyPreference: boolean;
}

export const useOrderSubmission = () => {

  return useMutation({
    mutationFn: async (orderData: OrderData) => {
      console.log('🚀 STEP 1: Starting order submission:', orderData);
      console.log('🎨 Engraving text being saved:', orderData.engravingText);
      console.log('💳 Payment method received:', orderData.paymentMethod);
      
      console.log('💾 STEP 2: Creating order in database...');
      
      // Get next order ID manually - find highest numeric order_id
      const { data: allOrders } = await supabase
        .from('orders')
        .select('order_id');
      
      let maxOrderId = 100274; // Start from last known good order
      if (allOrders) {
        allOrders.forEach(order => {
          const numId = parseInt(order.order_id);
          if (!isNaN(numId) && numId > maxOrderId) {
            maxOrderId = numId;
          }
        });
      }
      
      const nextOrderId = (maxOrderId + 1).toString();
      
      console.log('Max existing order ID:', maxOrderId, 'Next order ID will be:', nextOrderId);
      
      // First, create the order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_id: nextOrderId,
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          customer_email: orderData.customerEmail || null,
          customer_address: orderData.customerAddress,
          selected_edition: orderData.selectedEdition,
          selected_color: orderData.selectedColor,
          selected_accessories: orderData.selectedAccessories,
          engraving_text: orderData.engravingText?.trim() || null,
          payment_method: orderData.paymentMethod,
          subtotal: orderData.subtotal,
          delivery_fee: orderData.deliveryFee,
          total_amount: orderData.totalAmount,
          order_status: orderData.paymentMethod === 'online' ? 'pending_payment' : 'pending',
          payment_status: orderData.paymentMethod === 'online' ? 'pending' : 'pending',
          privacy_preference: orderData.privacyPreference
        }])
        .select()
        .single();

      if (orderError) {
        console.error('❌ STEP 2 FAILED: Order creation error:', orderError);
        throw orderError;
      }

      console.log('✅ STEP 2 SUCCESS: Order created:', order.id);
      
      // Skip email sending - will be sent from Thank You page
      console.log('📧 STEP 3: Email sending skipped - will be triggered from Thank You page');
      
      if (false) { // Disabled - emails will be sent from Thank You page

          console.log('📧 Sending emails for order:', order.id);
          
          // Fetch email templates from database
          console.log('📧 Fetching customer email template...');
          const { data: customerTemplate, error: customerTemplateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('type', 'order_customer')
            .single();
          
          console.log('📧 Customer template result:', { customerTemplate, customerTemplateError });

          // Send customer email only for COD orders
          if (orderData.customerEmail && orderData.paymentMethod === 'cod') {
            console.log('📧 Sending customer email to:', orderData.customerEmail);
            const paymentMethod = orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : (orderData.paymentMethod === 'online' ? 'Online Payment' : orderData.paymentMethod || 'Not specified');
            
            let customerEmailHTML = '';
            let customerSubject = `Order Confirmation - ${(order as any).order_id} | Ximpul Flow`;
            
            if (customerTemplate) {
              console.log('✅ Using admin portal customer template:', customerTemplate.name);
              // Use template from admin panel
              customerEmailHTML = customerTemplate.template
                .replace(/\$\{customerName\}/g, orderData.customerName)
                .replace(/\$\{orderId\}/g, (order as any).order_id)
                .replace(/\$\{selectedEdition\}/g, orderData.selectedEdition || 'Not specified')
                .replace(/\$\{selectedColor\}/g, orderData.selectedColor || 'Not specified')
                .replace(/\$\{paymentMethod\}/g, paymentMethod)
                .replace(/\$\{totalAmount\}/g, orderData.totalAmount?.toString() || 'Not specified')
                .replace(/\$\{customerPhone\}/g, orderData.customerPhone || 'Not provided')
                .replace(/\$\{customerEmail\}/g, orderData.customerEmail || 'Not provided')
                .replace(/\$\{customerAddress\}/g, orderData.customerAddress || 'Not provided')
                .replace(/\$\{engravingText\}/g, orderData.engravingText || '')
                .replace(/{{customerName}}/g, orderData.customerName)
                .replace(/{{orderId}}/g, (order as any).order_id)
                .replace(/{{selectedEdition}}/g, orderData.selectedEdition || 'Not specified')
                .replace(/{{selectedColor}}/g, orderData.selectedColor || 'Not specified')
                .replace(/{{paymentMethod}}/g, paymentMethod)
                .replace(/{{totalAmount}}/g, orderData.totalAmount?.toString() || 'Not specified')
                .replace(/{{customerPhone}}/g, orderData.customerPhone || 'Not provided')
                .replace(/{{customerEmail}}/g, orderData.customerEmail || 'Not provided')
                .replace(/{{customerAddress}}/g, orderData.customerAddress || 'Not provided')
                .replace(/{{engravingText}}/g, orderData.engravingText || '');
              
              customerSubject = customerTemplate.subject
                .replace(/\$\{orderId\}/g, (order as any).order_id)
                .replace(/{{orderId}}/g, (order as any).order_id);
            } else {
              console.log('⚠️ No customer portal templates available - using fallback template');
              console.log('⚠️ To use custom templates, create "order_customer" type template in Admin > SMTP Config > Templates');
              // Fallback to detailed template
              customerEmailHTML = `<h2>Order Confirmation</h2><p>Dear ${orderData.customerName},</p><p>Your order has been confirmed!</p><br><strong>Order Details:</strong><br>Order ID: #${(order as any).order_id}<br>Product: ${orderData.selectedEdition} Edition<br>Color: ${orderData.selectedColor}<br>Payment: ${paymentMethod}<br>Total: ${orderData.totalAmount} BDT<br><br><p>Thank you for choosing Ximpul!</p>`;
            }
            
            const customerEmailResult = await sendEmail({
              to: orderData.customerEmail,
              subject: customerSubject,
              message: customerEmailHTML,
              from_name: 'Ximpul Shop'
            });
            console.log('📧 Customer email response:', customerEmailResult);
            
            if (!customerEmailResult.success) {
              console.error('❌ Customer email failed:', customerEmailResult.error);
            } else {
              console.log('✅ Customer email sent successfully');
            }
          } else if (!orderData.customerEmail) {
            console.log('📧 No customer email provided, skipping customer notification');
          } else {
            console.log('📧 Skipping customer email for online payment - will be sent after payment confirmation');
          }
          
          // Send admin email only for COD orders
          if (orderData.paymentMethod === 'cod') {
            console.log('📧 STEP 3.1: Fetching admin email configuration for COD order...');
            const { data: emailConfig, error: emailConfigError } = await supabase
              .from('email_config')
              .select('*')
              .eq('config_type', 'customer');
            
            console.log('📧 Email config query result:', { emailConfig, emailConfigError });
            
            // Use configured emails only
            let adminEmails = '';
            let ccEmails = '';
            
            if (emailConfig && emailConfig.length > 0) {
              const config = emailConfig[0];
              if (config?.to_emails?.length > 0) {
                adminEmails = config.to_emails.join(',');
                console.log('📧 Using configured TO emails:', adminEmails);
              }
              if (config?.cc_emails?.length > 0) {
                ccEmails = config.cc_emails.join(',');
                console.log('📧 Using configured CC emails:', ccEmails);
              }
            }
            
            // Fetch admin email template
            console.log('📧 Fetching admin email template...');
            const { data: adminTemplate } = await supabase
              .from('email_templates')
              .select('*')
              .eq('type', 'order_admin')
              .single();
            
            // Send admin emails
            const paymentStatus = 'Cash on Delivery';
            
            let adminEmailHTML = '';
            let adminSubject = `New Ximpul Order - ${(order as any).order_id}`;
            
            if (adminTemplate) {
              console.log('✅ Using admin portal template:', adminTemplate.name);
              adminEmailHTML = adminTemplate.template
                .replace(/\$\{customerName\}/g, orderData.customerName)
                .replace(/\$\{customerPhone\}/g, orderData.customerPhone || 'Not provided')
                .replace(/\$\{customerEmail\}/g, orderData.customerEmail || 'Not provided')
                .replace(/\$\{customerAddress\}/g, orderData.customerAddress || 'Not provided')
                .replace(/\$\{orderId\}/g, (order as any).order_id)
                .replace(/\$\{selectedEdition\}/g, orderData.selectedEdition || 'Not specified')
                .replace(/\$\{selectedColor\}/g, orderData.selectedColor || 'Not specified')
                .replace(/\$\{engravingText\}/g, orderData.engravingText || '')
                .replace(/\$\{paymentMethod\}/g, paymentStatus)
                .replace(/\$\{totalAmount\}/g, orderData.totalAmount?.toString() || 'Not specified')
                .replace(/{{customerName}}/g, orderData.customerName)
                .replace(/{{customerPhone}}/g, orderData.customerPhone || 'Not provided')
                .replace(/{{customerEmail}}/g, orderData.customerEmail || 'Not provided')
                .replace(/{{customerAddress}}/g, orderData.customerAddress || 'Not provided')
                .replace(/{{orderId}}/g, (order as any).order_id)
                .replace(/{{selectedEdition}}/g, orderData.selectedEdition || 'Not specified')
                .replace(/{{selectedColor}}/g, orderData.selectedColor || 'Not specified')
                .replace(/{{engravingText}}/g, orderData.engravingText || '')
                .replace(/{{paymentMethod}}/g, paymentStatus)
                .replace(/{{totalAmount}}/g, orderData.totalAmount?.toString() || 'Not specified');
              
              adminSubject = adminTemplate.subject
                .replace(/\$\{orderId\}/g, (order as any).order_id)
                .replace(/{{orderId}}/g, (order as any).order_id);
            } else {
              console.log('⚠️ No admin portal templates available - using fallback template');
              adminEmailHTML = `<h2>New Order Alert</h2><p><strong>Order #${(order as any).order_id}</strong><br>Total: ${orderData.totalAmount} BDT</p><br><h3>Customer Information</h3><strong>Name:</strong><br>${orderData.customerName}<br><strong>Phone:</strong><br>${orderData.customerPhone || 'Not provided'}<br><strong>Email:</strong><br>${orderData.customerEmail || 'Not provided'}<br><strong>Address:</strong><br>${orderData.customerAddress || 'Not provided'}<br><br><h3>Product Details</h3><strong>Edition:</strong><br>${orderData.selectedEdition || 'Not specified'}<br><strong>Color:</strong><br>${orderData.selectedColor || 'Not specified'}<br>${orderData.engravingText ? `<strong>Engraving:</strong><br>${orderData.engravingText}<br>` : ''}<strong>Payment Method:</strong><br>${paymentStatus}<br><br><p>Please process this order.</p>`;
            }
            
            // Skip email if no admin emails configured
            if (!adminEmails) {
              console.log('⚠️ No admin emails configured, skipping admin notification');
            } else {
              console.log('📧 STEP 3.2: Sending admin email for COD order');
              
              const adminEmailResult = await sendEmail({
                to: adminEmails,
                subject: adminSubject,
                message: adminEmailHTML,
                from_name: 'Ximpul Shop',
                cc: ccEmails || undefined
              });
              console.log('📧 Admin email response:', adminEmailResult);
              
              if (!adminEmailResult.success) {
                console.error('❌ Admin email failed:', adminEmailResult.error);
              } else {
                console.log('✅ Admin email sent successfully');
              }
            }
          } else {
            console.log('📧 Skipping admin email for online payment - will be sent after payment confirmation');
          }
          
          const response = { ok: true };
          
        console.log('✅ STEP 3 SUCCESS: Emails sent successfully');
      } // End of disabled email block
      
      console.log('✅ STEP 3 SKIPPED: Emails will be sent from Thank You page');

      // If payment method is online, initialize SSLCommerz payment
      if (orderData.paymentMethod === 'online') {
		  console.log('💳 STEP 4: Initializing online payment for order:', order.id);
		  
		  // Create form and submit to payment handler
		  const form = document.createElement('form');
		  form.method = 'POST';
		  form.action = 'https://ximpul.com/payment-form.php';
		  
		  const fields = {
			customerName: orderData.customerName,
			customerPhone: orderData.customerPhone,
			customerEmail: orderData.customerEmail || `noemail+${order.id}@ximpul.com`,
			customerAddress: orderData.customerAddress,
			totalAmount: orderData.totalAmount,
			orderId: order.id
		  };
		  
		  Object.keys(fields).forEach(key => {
			const input = document.createElement('input');
			input.type = 'hidden';
			input.name = key;
			input.value = fields[key];
			form.appendChild(input);
		  });
		  
		  document.body.appendChild(form);
		  form.submit();
		  return order;
		}



      return order;
    },
    onSuccess: (data, orderData) => {
      // Only show success message for COD orders
      // Online payment success will be handled by the payment gateway redirect
      if (orderData.paymentMethod === 'cod') {
        // Show customer-appropriate message
        toast.success(`Order placed successfully! Order ID: ${(data as any).order_id}`);
        console.log('Order success toast shown');
        
        // Add admin notification only (emails are already sent in mutationFn)
        try {
          // Add admin notification with order details
          triggerOrderNotification({
            id: data.id,
            customer_name: orderData.customerName,
            customer_email: orderData.customerEmail,
            customer_phone: orderData.customerPhone,
            selected_edition: orderData.selectedEdition,
            selected_color: orderData.selectedColor,
            total_amount: orderData.totalAmount
          });
        } catch (error: any) {
          console.error('Error in order success handler:', error);
        }
        
        // Store data in sessionStorage for POST handling
        sessionStorage.setItem('thankYouPostData', JSON.stringify({
          orderId: (data as any).order_id,
          paymentMethod: orderData.paymentMethod,
          totalAmount: orderData.totalAmount.toString()
        }));
        
        console.log('📦 Stored order data for Thank You page:', {
          orderId: (data as any).order_id,
          paymentMethod: orderData.paymentMethod,
          totalAmount: orderData.totalAmount
        });
        
        // Redirect immediately without delay
        window.location.href = '/thank-you';
      }
    },
    onError: (error: any) => {
      console.error('❌ ORDER SUBMISSION FAILED:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      toast.error(`Failed to place order: ${error.message}`);
    },
  });
};