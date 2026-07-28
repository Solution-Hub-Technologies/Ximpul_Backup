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
      
      // Get next order ID manually by querying most recent orders sorted by created_at and order_id
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('order_id')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: maxOrders } = await supabase
        .from('orders')
        .select('order_id')
        .order('order_id', { ascending: false })
        .limit(100);

      let maxOrderId = 100274;
      const processOrders = (ordersList: any[] | null) => {
        if (ordersList) {
          ordersList.forEach(orderItem => {
            const numId = parseInt(orderItem.order_id);
            if (!isNaN(numId) && numId > maxOrderId) {
              maxOrderId = numId;
            }
          });
        }
      };

      processOrders(recentOrders);
      processOrders(maxOrders);

      console.log('Max existing order ID:', maxOrderId);

      let currentCandidateId = maxOrderId + 1;
      let order: any = null;
      let orderError: any = null;
      let attempts = 0;

      while (attempts < 10) {
        attempts++;
        const nextOrderId = currentCandidateId.toString();
        
        console.log(`Attempt ${attempts}: Trying order_id ${nextOrderId}`);

        const result = await supabase
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

        if (!result.error && result.data) {
          order = result.data;
          orderError = null;
          break;
        }

        if (result.error?.code === '23505') {
          console.warn(`⚠️ Order ID ${nextOrderId} already exists, retrying with ${currentCandidateId + 1}...`);
          currentCandidateId++;
        } else {
          orderError = result.error;
          break;
        }
      }

      if (orderError || !order) {
        console.error('❌ STEP 2 FAILED: Order creation error:', orderError);
        throw orderError;
      }

      console.log('✅ STEP 2 SUCCESS: Order created:', order.id, 'with order_id:', order.order_id);
      
      // Send Emails
      try {
        console.log('📧 STEP 3: Dispatching order notification emails...');

        const paymentMethodLabel = orderData.paymentMethod === 'cod' 
          ? 'Cash on Delivery' 
          : orderData.paymentMethod === 'online' 
          ? 'Online Payment' 
          : orderData.paymentMethod || 'Not specified';

        // Fetch Email Templates & Config
        const { data: customerTemplate } = await supabase
          .from('email_templates')
          .select('*')
          .eq('type', 'order_customer')
          .single();

        const { data: adminTemplate } = await supabase
          .from('email_templates')
          .select('*')
          .eq('type', 'order_admin')
          .single();

        const { data: emailConfig } = await supabase
          .from('email_config')
          .select('*')
          .eq('config_type', 'customer');

        let adminEmails = 'razinahmed60@gmail.com';
        let ccEmails = '';
        if (emailConfig && emailConfig.length > 0) {
          const config = emailConfig[0];
          if (config?.to_emails && config.to_emails.length > 0) {
            adminEmails = config.to_emails.join(',');
          }
          if (config?.cc_emails && config.cc_emails.length > 0) {
            ccEmails = config.cc_emails.join(',');
          }
        }

        // Send Customer Email
        if (orderData.customerEmail) {
          let customerSubject = `Order Confirmation #${order.order_id} | Ximpul`;
          let customerHTML = '';

          if (customerTemplate) {
            customerSubject = customerTemplate.subject
              .replace(/\$\{orderId\}/g, order.order_id)
              .replace(/{{orderId}}/g, order.order_id);

            customerHTML = customerTemplate.template
              .replace(/\$\{customerName\}/g, orderData.customerName)
              .replace(/\$\{orderId\}/g, order.order_id)
              .replace(/\$\{selectedEdition\}/g, orderData.selectedEdition || 'Standard')
              .replace(/\$\{selectedColor\}/g, orderData.selectedColor || 'Standard')
              .replace(/\$\{paymentMethod\}/g, paymentMethodLabel)
              .replace(/\$\{totalAmount\}/g, orderData.totalAmount?.toString() || '0')
              .replace(/{{customerName}}/g, orderData.customerName)
              .replace(/{{orderId}}/g, order.order_id)
              .replace(/{{selectedEdition}}/g, orderData.selectedEdition || 'Standard')
              .replace(/{{selectedColor}}/g, orderData.selectedColor || 'Standard')
              .replace(/{{paymentMethod}}/g, paymentMethodLabel)
              .replace(/{{totalAmount}}/g, orderData.totalAmount?.toString() || '0');
          } else {
            customerHTML = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #333;">Thank You for Your Order!</h2>
                <p>Dear ${orderData.customerName},</p>
                <p>We have successfully received your order <strong>#${order.order_id}</strong>.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <h3 style="margin-top: 0;">Order Summary</h3>
                  <p><strong>Order ID:</strong> #${order.order_id}</p>
                  <p><strong>Edition:</strong> ${orderData.selectedEdition}</p>
                  <p><strong>Color:</strong> ${orderData.selectedColor}</p>
                  <p><strong>Payment Method:</strong> ${paymentMethodLabel}</p>
                  <p><strong>Total Amount:</strong> ৳${orderData.totalAmount}</p>
                </div>
                <p>We will process your order shortly.</p>
                <p>Best regards,<br><strong>Ximpul Team</strong></p>
              </div>
            `;
          }

          console.log('📧 Sending customer email to:', orderData.customerEmail);
          const custResult = await sendEmail({
            to: orderData.customerEmail,
            subject: customerSubject,
            message: customerHTML,
            from_name: 'Ximpul'
          });
          console.log('📧 Customer email result:', custResult);
        }

        // Send Admin Email
        let adminSubject = `New Order Received: #${order.order_id} | Ximpul`;
        let adminHTML = '';

        if (adminTemplate) {
          adminSubject = adminTemplate.subject
            .replace(/\$\{orderId\}/g, order.order_id)
            .replace(/{{orderId}}/g, order.order_id);

          adminHTML = adminTemplate.template
            .replace(/\$\{customerName\}/g, orderData.customerName)
            .replace(/\$\{customerPhone\}/g, orderData.customerPhone)
            .replace(/\$\{customerEmail\}/g, orderData.customerEmail || 'Not provided')
            .replace(/\$\{customerAddress\}/g, orderData.customerAddress)
            .replace(/\$\{orderId\}/g, order.order_id)
            .replace(/\$\{selectedEdition\}/g, orderData.selectedEdition)
            .replace(/\$\{selectedColor\}/g, orderData.selectedColor)
            .replace(/\$\{engravingText\}/g, orderData.engravingText || 'None')
            .replace(/\$\{paymentMethod\}/g, paymentMethodLabel)
            .replace(/\$\{totalAmount\}/g, orderData.totalAmount?.toString() || '0')
            .replace(/{{customerName}}/g, orderData.customerName)
            .replace(/{{customerPhone}}/g, orderData.customerPhone)
            .replace(/{{customerEmail}}/g, orderData.customerEmail || 'Not provided')
            .replace(/{{customerAddress}}/g, orderData.customerAddress)
            .replace(/{{orderId}}/g, order.order_id)
            .replace(/{{selectedEdition}}/g, orderData.selectedEdition)
            .replace(/{{selectedColor}}/g, orderData.selectedColor)
            .replace(/{{engravingText}}/g, orderData.engravingText || 'None')
            .replace(/{{paymentMethod}}/g, paymentMethodLabel)
            .replace(/{{totalAmount}}/g, orderData.totalAmount?.toString() || '0');
        } else {
          adminHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #111;">New Order Alert!</h2>
              <p>A new order <strong>#${order.order_id}</strong> has been placed on Ximpul.</p>
              <div style="background-color: #f4f4f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3 style="margin-top: 0;">Order & Customer Details</h3>
                <p><strong>Order ID:</strong> #${order.order_id}</p>
                <p><strong>Customer Name:</strong> ${orderData.customerName}</p>
                <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
                <p><strong>Email:</strong> ${orderData.customerEmail || 'Not provided'}</p>
                <p><strong>Address:</strong> ${orderData.customerAddress}</p>
                <p><strong>Edition:</strong> ${orderData.selectedEdition}</p>
                <p><strong>Color:</strong> ${orderData.selectedColor}</p>
                <p><strong>Engraving:</strong> ${orderData.engravingText || 'None'}</p>
                <p><strong>Payment Method:</strong> ${paymentMethodLabel}</p>
                <p><strong>Total Amount:</strong> ৳${orderData.totalAmount}</p>
              </div>
            </div>
          `;
        }

        console.log('📧 Sending admin email to:', adminEmails);
        const admResult = await sendEmail({
          to: adminEmails,
          subject: adminSubject,
          message: adminHTML,
          from_name: 'Ximpul Order Alert',
          cc: ccEmails || undefined
        });
        console.log('📧 Admin email result:', admResult);

        sessionStorage.setItem(`emailSent_${order.id}`, 'true');
        console.log('✅ STEP 3 SUCCESS: All order emails processed');
      } catch (emailErr) {
        console.error('⚠️ STEP 3 WARNING: Error sending order emails:', emailErr);
      }
      
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