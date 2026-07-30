import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function extractParams(req: VercelRequest): Record<string, any> {
  const queryParams = req.query || {};
  let bodyParams: Record<string, any> = {};

  if (req.body) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      bodyParams = req.body;
    } else {
      const rawStr = Buffer.isBuffer(req.body) ? req.body.toString('utf-8') : String(req.body);
      try {
        bodyParams = JSON.parse(rawStr);
      } catch {
        const searchParams = new URLSearchParams(rawStr);
        searchParams.forEach((val, key) => {
          bodyParams[key] = val;
        });
      }
    }
  }

  return { ...queryParams, ...bodyParams };
}

const isUuidPattern = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const params = extractParams(req);
  console.log('💳 Payment callback received with raw params:', JSON.stringify(params));

  const orderId = String(params.orderId || params.tran_id || '').trim();
  const statusParam = String(params.status || '').toLowerCase();
  const val_id = params.val_id ? String(params.val_id).trim() : undefined;

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'ximpul.com';
  const baseUrl = `${protocol}://${host}`;

  console.log(`💳 Parsed callback -> orderId: "${orderId}", status: "${statusParam}", val_id: "${val_id}"`);

  const store_id = process.env.SSLCOMMERZ_STORE_ID;
  const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const is_live = process.env.SSLCOMMERZ_IS_LIVE !== 'false';

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://bvjgogntjsrzamskscbg.supabase.co';
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.VITE_SUPABASE_ANON_KEY || '');

  // Helper to safely update order status in Supabase
  const updateOrderInDb = async (targetId: string, paymentStatus: string, orderStatus: string, transactionId?: string) => {
    if (!targetId) return null;

    const updatePayload: Record<string, any> = {
      payment_status: paymentStatus,
      order_status: orderStatus,
    };
    if (transactionId) {
      updatePayload.payment_transaction_id = transactionId;
    }

    try {
      if (isUuidPattern(targetId)) {
        const { data } = await supabase.from('orders').update(updatePayload).eq('id', targetId).select();
        if (data && data.length > 0) return data[0];
      }

      // Try matching order_id column
      const { data: orderData } = await supabase.from('orders').update(updatePayload).eq('order_id', targetId).select();
      if (orderData && orderData.length > 0) return orderData[0];

      return null;
    } catch (err) {
      console.error(`Error updating order ${targetId}:`, err);
      return null;
    }
  };

  // Handle Failure / Cancel cases
  if (statusParam === 'fail' || statusParam === 'failed' || statusParam === 'cancel' || statusParam === 'cancelled') {
    console.log(`❌ Payment failed/cancelled for order: ${orderId}`);
    if (orderId) {
      await updateOrderInDb(orderId, statusParam.includes('cancel') ? 'cancelled' : 'failed', 'cancelled');
    }
    return res.redirect(302, `${baseUrl}/payment-failed?orderId=${encodeURIComponent(orderId || '')}`);
  }

  let updatedOrder: any = null;
  let isPaymentVerified = false;

  // 1. Validate with SSLCommerz Server Validation API if val_id is provided
  if (val_id && store_id && store_passwd) {
    try {
      const validationEndpoint = is_live
        ? `https://securepay.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(val_id)}&store_id=${encodeURIComponent(store_id)}&store_passwd=${encodeURIComponent(store_passwd)}&format=json`
        : `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(val_id)}&store_id=${encodeURIComponent(store_id)}&store_passwd=${encodeURIComponent(store_passwd)}&format=json`;

      console.log(`🔐 Validating val_id (${val_id}) with SSLCommerz...`);
      const valRes = await fetch(validationEndpoint);
      const valData = await valRes.json();

      console.log('🔍 SSLCommerz Validation response:', valData);

      if (valData && (valData.status === 'VALID' || valData.status === 'VALIDATED')) {
        isPaymentVerified = true;
        const finalOrderId = valData.tran_id || orderId;
        updatedOrder = await updateOrderInDb(finalOrderId, 'completed', 'processing', val_id);
      }
    } catch (valErr) {
      console.error('⚠️ SSLCommerz validation API call error:', valErr);
    }
  }

  // 2. Fallback: If status=success parameter or payment verified
  if (!updatedOrder && (statusParam === 'success' || isPaymentVerified) && orderId) {
    console.log(`🔄 Updating database status for order #${orderId}...`);
    updatedOrder = await updateOrderInDb(orderId, 'completed', 'processing', val_id || 'online_paid');
  }

  // 3. Dispatch Notification Emails for Confirmed Online Payment
  if (updatedOrder || isPaymentVerified || statusParam === 'success') {
    try {
      const customerEmail = updatedOrder?.customer_email || params.cus_email;
      const customerName = updatedOrder?.customer_name || params.cus_name || 'Customer';
      const orderCode = updatedOrder?.order_id || orderId;
      const totalAmount = updatedOrder?.total_amount || params.amount || '0';

      const lambdaUrl = process.env.LAMBDA_API_URL || process.env.VITE_LAMBDA_API_URL || 'https://v1t9e2n4qf.execute-api.ap-south-1.amazonaws.com/send-email';
      const lambdaSecret = process.env.LAMBDA_SECRET || process.env.VITE_LAMBDA_SECRET || '';
      const adminEmail = (process.env.ADMIN_EMAIL || 'razinahmed60@gmail.com').trim();

      console.log(`📧 Sending payment confirmation emails for order #${orderCode} to ${customerEmail}...`);

      if (customerEmail && lambdaUrl) {
        await fetch(lambdaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Ximpul',
            email: adminEmail,
            to: customerEmail,
            subject: `Payment Confirmed - Order #${orderCode} | Ximpul`,
            source: 'Ximpul Flow',
            secretKey: lambdaSecret,
            htmlTemplate: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #10b981;">Payment Received & Order Confirmed!</h2>
                <p>Dear ${customerName},</p>
                <p>Your online payment of <strong>৳${totalAmount}</strong> for order <strong>#${orderCode}</strong> was successfully received.</p>
                <p>We are processing your order for delivery.</p>
                <p>Best regards,<br><strong>Ximpul Team</strong></p>
              </div>
            `
          })
        }).catch(e => console.error('Customer mail fetch error:', e));
      }

      if (lambdaUrl) {
        await fetch(lambdaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Ximpul Order Alert',
            email: adminEmail,
            to: adminEmail,
            subject: `Payment Received - Order #${orderCode} | Ximpul`,
            source: 'Ximpul Flow',
            secretKey: lambdaSecret,
            htmlTemplate: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #10b981;">Online Payment Received!</h2>
                <p>Order <strong>#${orderCode}</strong> payment of ৳${totalAmount} has been verified.</p>
                <p><strong>Customer:</strong> ${customerName} (${customerEmail || 'No email'})</p>
                <p><strong>Transaction ID:</strong> ${val_id || 'Online'}</p>
              </div>
            `
          })
        }).catch(e => console.error('Admin mail fetch error:', e));
      }
    } catch (mailErr) {
      console.error('⚠️ Exception sending payment emails:', mailErr);
    }

    return res.redirect(302, `${baseUrl}/thank-you?orderId=${encodeURIComponent(orderId)}&paymentMethod=online`);
  }

  return res.redirect(302, `${baseUrl}/thank-you?orderId=${encodeURIComponent(orderId)}&paymentMethod=online`);
}
