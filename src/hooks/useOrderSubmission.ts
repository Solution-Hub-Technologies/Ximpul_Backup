import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { triggerOrderNotification } from '@/utils/order-notification';
import { sendOrderEmails } from '@/utils/emailjs-service';

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
          privacy_preference: orderData.privacyPreference
        }])
        .select()
        .single();

      if (orderError) {
        console.error('❌ STEP 2 FAILED: Order creation error:', orderError);
        throw orderError;
      }

      console.log('✅ STEP 2 SUCCESS: Order created:', order.id);
      
      // Send emails for all orders
      console.log('📧 STEP 3: Sending email notifications...');
      
      try {

          console.log('📧 Sending emails for order:', order.id);
          
          // Fetch email templates from database
          console.log('📧 Fetching customer email template...');
          const { data: customerTemplate, error: customerTemplateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('type', 'order_customer')
            .single();
          
          console.log('📧 Customer template result:', { customerTemplate, customerTemplateError });

          // Send customer email if provided
          if (orderData.customerEmail) {
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
            
            const customerEmailResponse = await fetch('https://ximpul.com/smtp-mailer.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                to: orderData.customerEmail,
                subject: customerSubject,
                message: customerEmailHTML,
                from_name: 'Ximpul Shop'
              })
            });
            
            const customerEmailResult = await customerEmailResponse.json();
            console.log('📧 Customer email response:', customerEmailResult);
            
            if (!customerEmailResult.success) {
              console.error('❌ Customer email failed:', customerEmailResult.error);
            } else {
              console.log('✅ Customer email sent successfully');
            }
          } else {
            console.log('📧 No customer email provided, skipping customer notification');
          }
          
          // Fetch admin email configuration from database
          console.log('📧 STEP 3.1: Fetching admin email configuration...');
          const { data: emailConfig, error: emailConfigError } = await supabase
            .from('email_config')
            .select('*')
            .eq('config_type', 'customer');
          
          console.log('📧 Email config query result:', { emailConfig, emailConfigError });
          console.log('📧 Email config raw data:', JSON.stringify(emailConfig, null, 2));
          
          // Also fetch all email configs for debugging
          const { data: allEmailConfigs } = await supabase
            .from('email_config')
            .select('*');
          console.log('📧 All email configs in database:', JSON.stringify(allEmailConfigs, null, 2));
          
          // Use configured emails or fallback to default
          let adminEmails = 'ximpulshop@gmail.com'; // Default fallback
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
          } else {
            console.log('📧 No email config found, using fallback:', adminEmails);
            console.log('📧 Attempting to create default email config...');
            // If no config exists, try to create one with default email
            try {
              const { data: insertResult, error: insertError } = await supabase
                .from('email_config')
                .insert({
                  config_type: 'customer',
                  to_emails: ['ximpulshop@gmail.com'],
                  cc_emails: []
                })
                .select();
              console.log('📧 Insert result:', { insertResult, insertError });
              if (!insertError) {
                console.log('📧 Created default email config successfully');
                adminEmails = 'ximpulshop@gmail.com';
              }
            } catch (insertError) {
              console.log('📧 Could not create default config:', insertError);
            }
          }
          
          console.log('📧 Final TO emails:', adminEmails);
          console.log('📧 Final CC emails:', ccEmails);
          console.log('📧 Email config used:', emailConfig?.[0] || 'No config found');
          
          // Fetch admin email template
          console.log('📧 Fetching admin email template...');
          const { data: adminTemplate, error: adminTemplateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('type', 'order_admin')
            .single();
          
          console.log('📧 Admin template result:', { adminTemplate, adminTemplateError });
          
          // If no order_admin template found, try any template
          let finalAdminTemplate = adminTemplate;
          if (!adminTemplate) {
            console.log('📧 No order_admin template found, trying any template...');
            const { data: anyTemplate } = await supabase
              .from('email_templates')
              .select('*')
              .limit(1)
              .single();
            finalAdminTemplate = anyTemplate;
            console.log('📧 Using any available template:', finalAdminTemplate);
            
            if (!finalAdminTemplate) {
              console.log('⚠️ No email templates found in admin portal! Using fallback template.');
              console.log('⚠️ Please create "order_admin" template in Admin > SMTP Config > Templates tab');
            }
          }

          // Send admin emails
          const paymentStatus = orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : (orderData.paymentMethod === 'online' ? 'Online Payment' : orderData.paymentMethod || 'Not specified');
          
          let adminEmailHTML = '';
          let adminSubject = `New Ximpul Order - ${(order as any).order_id}`;
          
          if (finalAdminTemplate) {
            console.log('✅ Using admin portal template:', finalAdminTemplate.name);
            // Use template from admin panel - support both ${} and {{}} syntax
            adminEmailHTML = finalAdminTemplate.template
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
            
            adminSubject = finalAdminTemplate.subject
              .replace(/\$\{orderId\}/g, (order as any).order_id)
              .replace(/{{orderId}}/g, (order as any).order_id);
          } else {
            console.log('⚠️ No admin portal templates available - using fallback template');
            console.log('⚠️ To use custom templates, create them in Admin > SMTP Config > Templates');
            // Fallback to detailed template
            adminEmailHTML = `<h2>New Order Alert</h2><p><strong>Order #${(order as any).order_id}</strong><br>Total: ${orderData.totalAmount} BDT</p><br><h3>Customer Information</h3><strong>Name:</strong><br>${orderData.customerName}<br><strong>Phone:</strong><br>${orderData.customerPhone || 'Not provided'}<br><strong>Email:</strong><br>${orderData.customerEmail || 'Not provided'}<br><strong>Address:</strong><br>${orderData.customerAddress || 'Not provided'}<br><br><h3>Product Details</h3><strong>Edition:</strong><br>${orderData.selectedEdition || 'Not specified'}<br><strong>Color:</strong><br>${orderData.selectedColor || 'Not specified'}<br>${orderData.engravingText ? `<strong>Engraving:</strong><br>${orderData.engravingText}<br>` : ''}<strong>Payment Method:</strong><br>${paymentStatus}<br><br><p>Please process this order.</p>`;
          }
          
          const emailParams: any = {
            to: adminEmails,
            subject: adminSubject,
            message: adminEmailHTML,
            from_name: 'Ximpul Shop'
          };
          
          // Add CC emails if configured
          if (ccEmails) {
            emailParams.cc = ccEmails;
          }
          
          console.log('📧 STEP 3.2: Sending admin email with params:', emailParams);
          console.log('📧 Admin email HTML length:', adminEmailHTML.length);
          console.log('📧 Admin template found:', !!finalAdminTemplate);
          
          const adminEmailResponse = await fetch('https://ximpul.com/smtp-mailer.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(emailParams)
          });
          
          console.log('📧 Admin email response status:', adminEmailResponse.status);
          const adminEmailResult = await adminEmailResponse.json();
          console.log('📧 Admin email full response:', adminEmailResult);
          
          if (!adminEmailResult.success) {
            console.error('❌ Admin email failed:', adminEmailResult.error);
            console.error('❌ Admin email error details:', adminEmailResult);
          } else {
            console.log('✅ Admin email sent successfully');
          }
          
          const response = { ok: true };
          
        console.log('✅ STEP 3 SUCCESS: Emails sent successfully');
      } catch (emailError: any) {
        console.error('⚠️ STEP 3 WARNING: Email sending failed:', emailError);
        // Don't fail the order if email fails
      }

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
          orderId: data.id,
          paymentMethod: orderData.paymentMethod,
          totalAmount: orderData.totalAmount.toString()
        }));
        
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