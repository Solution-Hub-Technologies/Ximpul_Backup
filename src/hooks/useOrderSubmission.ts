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
      
      // Send emails only for COD orders (online payment emails sent after payment success)
      if (orderData.paymentMethod === 'cod') {
        console.log('📧 STEP 3: Sending email notification for COD order...');
        
        try {
          console.log('📧 Sending emails for COD order:', order.id);
          console.log('📧 Email URL:', 'https://202.59.208.114:3001/send-order-emails');
          console.log('📧 Email payload:', {
            order_id: (order as any).order_id,
            customer_name: orderData.customerName,
            customer_email: orderData.customerEmail,
            customer_phone: orderData.customerPhone,
            customer_address: orderData.customerAddress,
            selected_edition: orderData.selectedEdition,
            selected_color: orderData.selectedColor,
            engraving_text: orderData.engravingText,
            total_amount: orderData.totalAmount,
            payment_method: orderData.paymentMethod
          });
          
          // Send customer email if provided
          if (orderData.customerEmail) {
            const paymentMethod = orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : (orderData.paymentMethod === 'online' ? 'Online Payment' : orderData.paymentMethod || 'Not specified');
            
            const customerEmailHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Order Confirmation - Ximpul Flow</title></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;"><div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;"><div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 40px 30px; text-align: center;"><h1 style="color: #ffffff; font-size: 28px; font-weight: 300; margin: 0 0 10px 0; letter-spacing: 1px;">XIMPUL FLOW</h1><p style="color: #d1d5db; font-size: 16px; margin: 0;">Order Confirmation</p></div><div style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;"><div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 24px;">OK</span></div><h2 style="color: #1f2937; font-size: 24px; font-weight: 400; margin: 0 0 10px 0;">Thank You, ${orderData.customerName}!</h2><p style="color: #6b7280; font-size: 16px; margin: 0;">Your order has been confirmed and is being processed.</p></div><div style="padding: 30px;"><div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 30px;"><h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Order Summary</h3><table style="width: 100%; border-collapse: collapse;"><tr><td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Order ID:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 700; font-family: monospace;">#${(order as any).order_id}</td></tr><tr><td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Product:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${orderData.selectedEdition} Edition</td></tr><tr><td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Color:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${orderData.selectedColor}</td></tr><tr><td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Payment:</td><td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${paymentMethod}</td></tr><tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 12px 0 8px 0; color: #1f2937; font-weight: 700; font-size: 18px;">Total:</td><td style="padding: 12px 0 8px 0; color: #1f2937; font-weight: 700; font-size: 18px;">${orderData.totalAmount} BDT</td></tr></table></div><div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px;"><h3 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Track Your Order</h3><p style="color: #d1d5db; margin: 0 0 20px 0;">Monitor your order status in real-time</p><a href="https://ximpul.com/track-order?orderId=${(order as any).order_id}" style="display: inline-block; background-color: #ffffff; color: #1f2937; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">Track Order #${(order as any).order_id}</a><p style="color: #9ca3af; font-size: 14px; margin: 15px 0 0 0;">Or visit ximpul.com/track-order</p></div><div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px;"><h4 style="color: #065f46; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">What happens next?</h4><p style="color: #047857; margin: 0; line-height: 1.6;">${orderData.paymentMethod === 'cod' ? 'We will prepare your order for delivery. Please keep the exact amount ready for cash on delivery.' : 'Your payment has been processed successfully. We will prepare your order for delivery.'}</p></div><div style="text-align: center; padding: 20px 0;"><p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Thank you for choosing Ximpul Flow - a product built with care, purpose, and the belief that water should be free.</p><p style="color: #1f2937; font-weight: 600; font-size: 18px; margin: 0;">Your Water. Your Freedom.</p></div></div><div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;"><p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Need help? Contact us:</p><p style="color: #1f2937; font-weight: 600; margin: 0;">Email: ximpulshop@gmail.com | Phone: 01881408611</p><p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">Copyright 2024 Ximpul. All rights reserved.</p></div></div></body></html>`;
            
            await fetch('https://ximpul.com/smtp-mailer.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                to: orderData.customerEmail,
                subject: `Order Confirmation - ${(order as any).order_id} | Ximpul Flow`,
                message: customerEmailHTML,
                from_name: 'Ximpul Shop'
              })
            });
          }
          
          // Send admin emails to both addresses with beautiful HTML design
          const paymentStatus = orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : (orderData.paymentMethod === 'online' ? 'Online Payment' : orderData.paymentMethod || 'Not specified');
          
          const adminEmailHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>New Order Alert - Ximpul Admin</title></head><body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f1f5f9;"><div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"><div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;"><div style="background-color: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 24px;">!</span></div><h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 5px 0;">New Order Alert</h1><p style="color: #fecaca; font-size: 14px; margin: 0;">Immediate attention required</p></div><div style="padding: 30px;"><div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;"><h2 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 10px 0;">Order #${(order as any).order_id}</h2><p style="color: #d1d5db; font-size: 14px; margin: 0;">Total: <span style="font-size: 18px; font-weight: 700; color: #10b981;">${orderData.totalAmount || 'Not specified'} BDT</span></p></div><div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 25px;"><h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Customer Information</h3><div style="display: grid; gap: 12px;"><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span style="color: #64748b; font-weight: 500;">Name:</span><span style="color: #1f2937; font-weight: 600;">${orderData.customerName}</span></div><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span style="color: #64748b; font-weight: 500;">Phone:</span><span style="color: #1f2937; font-weight: 600;">${orderData.customerPhone || 'Not provided'}</span></div><div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span style="color: #64748b; font-weight: 500;">Email:</span><span style="color: #1f2937; font-weight: 600;">${orderData.customerEmail || 'Not provided'}</span></div><div style="padding: 8px 0;"><span style="color: #64748b; font-weight: 500; display: block; margin-bottom: 5px;">Address:</span><span style="color: #1f2937; font-weight: 600; background-color: #ffffff; padding: 10px; border-radius: 6px; display: block;">${orderData.customerAddress || 'Not provided'}</span></div></div></div><div style="background-color: #f0f9ff; border-radius: 12px; padding: 25px; margin-bottom: 25px;"><h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 15px 0; border-bottom: 2px solid #bfdbfe; padding-bottom: 8px;">Product Details</h3><div style="display: grid; gap: 12px;"><div style="display: flex; justify-content: space-between; padding: 8px 0;"><span style="color: #1e40af; font-weight: 500;">Edition:</span><span style="color: #1f2937; font-weight: 600;">${orderData.selectedEdition || 'Not specified'}</span></div><div style="display: flex; justify-content: space-between; padding: 8px 0;"><span style="color: #1e40af; font-weight: 500;">Color:</span><span style="color: #1f2937; font-weight: 600;">${orderData.selectedColor || 'Not specified'}</span></div>${orderData.engravingText ? `<div style="padding: 8px 0;"><span style="color: #1e40af; font-weight: 500; display: block; margin-bottom: 5px;">Engraving:</span><span style="color: #1f2937; font-weight: 600; background-color: #ffffff; padding: 10px; border-radius: 6px; display: block; font-style: italic;">${orderData.engravingText}</span></div>` : ''}<div style="display: flex; justify-content: space-between; padding: 8px 0;"><span style="color: #1e40af; font-weight: 500;">Payment Method:</span><span style="color: #1f2937; font-weight: 600;">${paymentStatus}</span></div></div></div><div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 20px; text-align: center;"><h4 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">Action Required</h4><p style="color: #fef3c7; margin: 0 0 15px 0; font-size: 14px;">Please process this order in the admin dashboard</p><a href="https://ximpul.com/admin/orders" style="display: inline-block; background-color: #ffffff; color: #d97706; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">View in Dashboard</a></div></div><div style="background-color: #1f2937; padding: 20px; text-align: center;"><p style="color: #9ca3af; font-size: 12px; margin: 0;">Ximpul Admin Panel | Order Management System</p><p style="color: #6b7280; font-size: 11px; margin: 5px 0 0 0;">This is an automated notification</p></div></div></body></html>`;
          
          await fetch('https://ximpul.com/smtp-mailer.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              to: 'ximpulshop@gmail.com',
              cc: 'nahid@sohub.com.bd,shariar@sohub.com.bd,sadiq.shahrior19@gmail.com,sunnyat@sohub.com.bd',
              subject: `New Ximpul Order - ${(order as any).order_id}`,
              message: adminEmailHTML,
              from_name: 'Ximpul Shop'
            })
          });
          
          const response = { ok: true };
          
          console.log('✅ STEP 3 SUCCESS: COD emails sent successfully');
        } catch (emailError: any) {
          console.error('⚠️ STEP 3 WARNING: COD email sending failed:', emailError);
          // Don't fail the order if email fails
        }
      } else {
        console.log('📧 STEP 3: Skipping emails for online payment (will send after payment success)');
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