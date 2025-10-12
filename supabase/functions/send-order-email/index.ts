import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sanitize data for logging to prevent log injection
const sanitizeForLog = (data: any): string => {
  if (typeof data === 'string') {
    return data.replace(/[\r\n\t\x00-\x1f\x7f-\x9f]/g, ' ').replace(/[<>"'&]/g, '').substring(0, 100);
  }
  return String(data).replace(/[\r\n\t\x00-\x1f\x7f-\x9f]/g, ' ').replace(/[<>"'&]/g, '').substring(0, 100);
};

// Sanitize HTML content to prevent XSS
const sanitizeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Send emails via the email server
const sendEmailViaServer = async (orderData: any) => {
  try {
    console.log('Attempting to send emails via server for order:', sanitizeForLog(orderData.order_id));
    
    const response = await fetch('http://202.59.208.114:3001/send-order-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    console.log('Email server response status:', sanitizeForLog(response.status));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email server error response:', sanitizeForLog(errorText));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Email server success response received');
    return result;
  } catch (error) {
    console.error('Error calling email server:', sanitizeForLog(error));
    // Return a fallback response instead of throwing
    return { success: false, error: error.message };
  }
};

interface OrderEmailRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  selectedEdition: string;
  selectedColor: string;
  totalAmount: number;
  paymentMethod: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderEmailRequest = await req.json();
    console.log('Received order email request for:', sanitizeForLog(orderData.orderId));

    // Validate required fields
    if (!orderData.customerEmail || !orderData.orderId) {
      console.log('Missing required fields - email exists:', !!orderData.customerEmail, 'orderId exists:', !!orderData.orderId);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Email content for customer
    const customerEmailContent = `
      <h2>Thank you for your order!</h2>
      <p>Dear ${sanitizeHtml(orderData.customerName)},</p>
      
      <p>Thank you for choosing Ximpul Flow — a product built with care, purpose, and the belief that water should be free.</p>
      
      <p>By carrying your own bottle, you're not just staying hydrated —<br>
      You're joining a movement to end plastic waste.<br>
      You're making a bold choice for freedom, simplicity, and sustainability.<br>
      You're choosing #TruePrice — honest quality, no brand premium.</p>
      
      <p>We are honored to have you with us on this journey.</p>
      
      <p>Stay hydrated. Stay inspired. Stay original.<br>
      — Team Ximpul</p>
      
      <p><strong>💧 Your Water. Your Freedom.</strong></p>
      
      <hr>
      
      <h3>Order Details:</h3>
      <ul>
        <li><strong>Order ID:</strong> ${sanitizeHtml(orderData.orderId)}</li>
        <li><strong>Edition:</strong> ${sanitizeHtml(orderData.selectedEdition)}</li>
        <li><strong>Color:</strong> ${sanitizeHtml(orderData.selectedColor)}</li>
        <li><strong>Total Amount:</strong> ${sanitizeHtml(String(orderData.totalAmount))} BDT</li>
        <li><strong>Payment Method:</strong> ${sanitizeHtml(orderData.paymentMethod)}</li>
      </ul>
      
      <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <h3 style="color: #0369a1; margin-bottom: 10px;">📦 Track Your Order</h3>
        <p style="margin-bottom: 15px;"><strong>You can track your order status anytime using your Order ID:</strong></p>
        <a href="https://ximpul.com/track-order" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">Track Order: ${sanitizeHtml(orderData.orderId)}</a>
        <p style="font-size: 14px; color: #64748b;">Or visit: <strong>https://ximpul.com/track-order</strong> and enter your Order ID</p>
      </div>
    `;

    // Admin notification content
    const adminEmailContent = `
      <h2>New Order Received</h2>
      
      <h3>Customer Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${sanitizeHtml(orderData.customerName)}</li>
        <li><strong>Email:</strong> ${sanitizeHtml(orderData.customerEmail)}</li>
        <li><strong>Phone:</strong> ${sanitizeHtml(orderData.customerPhone)}</li>
      </ul>
      
      <h3>Order Details:</h3>
      <ul>
        <li><strong>Order ID:</strong> ${sanitizeHtml(orderData.orderId)}</li>
        <li><strong>Edition:</strong> ${sanitizeHtml(orderData.selectedEdition)}</li>
        <li><strong>Color:</strong> ${sanitizeHtml(orderData.selectedColor)}</li>
        <li><strong>Total Amount:</strong> ${sanitizeHtml(String(orderData.totalAmount))} BDT</li>
        <li><strong>Payment Method:</strong> ${sanitizeHtml(orderData.paymentMethod)}</li>
        <li><strong>Order Time:</strong> ${new Date().toISOString()}</li>
      </ul>
    `;

    console.log('Sending emails for order:', sanitizeForLog(orderData.orderId));
    
    try {
      const emailResult = await sendEmailViaServer({
        order_id: orderData.orderId,
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        selected_edition: orderData.selectedEdition,
        selected_color: orderData.selectedColor,
        total_amount: orderData.totalAmount,
        payment_method: orderData.paymentMethod
      });
      
      console.log('Emails sent successfully for order:', sanitizeForLog(orderData.orderId));
    } catch (emailError) {
      console.error('Error sending emails:', sanitizeForLog(emailError));
      // Continue execution even if email fails
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email notification processed' 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", sanitizeForLog(error));
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
