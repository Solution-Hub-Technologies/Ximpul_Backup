import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const queryParams = req.query || {};
  const bodyParams = req.body || {};
  const params = { ...queryParams, ...bodyParams };

  const orderId = params.orderId || params.tran_id;
  const statusParam = (params.status || '').toLowerCase();
  const val_id = params.val_id;

  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'ximpul.com';
  const baseUrl = `${protocol}://${host}`;

  console.log(`💳 Payment callback received for orderId: ${orderId}, status: ${statusParam}, val_id: ${val_id}`);

  const store_id = process.env.SSLCOMMERZ_STORE_ID;
  const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const is_live = process.env.SSLCOMMERZ_IS_LIVE !== 'false';

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://bvjgogntjsrzamskscbg.supabase.co';
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.VITE_SUPABASE_ANON_KEY || '');

  // Handle Failure / Cancel cases
  if (statusParam === 'fail' || statusParam === 'failed' || statusParam === 'cancel' || statusParam === 'cancelled') {
    console.log(`❌ Payment failed or cancelled by user for order #${orderId}`);
    if (orderId) {
      await supabase
        .from('orders')
        .update({
          payment_status: statusParam.includes('cancel') ? 'cancelled' : 'failed',
        })
        .or(`order_id.eq.${orderId},id.eq.${orderId}`);
    }
    return res.redirect(302, `${baseUrl}/payment-failed?orderId=${encodeURIComponent(orderId || '')}`);
  }

  // Handle Success case - Validate with SSLCommerz API
  if (val_id && store_id && store_passwd) {
    try {
      const validationEndpoint = is_live
        ? `https://securepay.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(val_id)}&store_id=${encodeURIComponent(store_id)}&store_passwd=${encodeURIComponent(store_passwd)}&format=json`
        : `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(val_id)}&store_id=${encodeURIComponent(store_id)}&store_passwd=${encodeURIComponent(store_passwd)}&format=json`;

      const valRes = await fetch(validationEndpoint);
      const valData = await valRes.json();

      console.log('🔍 SSLCommerz Validation API response:', valData);

      const isValid = valData && (valData.status === 'VALID' || valData.status === 'VALIDATED');

      if (isValid) {
        const actualOrderId = valData.tran_id || orderId;
        const totalAmount = valData.amount || params.amount || '0';

        console.log(`✅ SSLCommerz Payment VALIDATED for order #${actualOrderId}`);

        // Update database order payment_status to 'completed' and order_status to 'processing'
        const { data: updatedOrders, error: updateErr } = await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            order_status: 'processing',
            payment_transaction_id: val_id,
          })
          .or(`order_id.eq.${actualOrderId},id.eq.${actualOrderId}`)
          .select();

        if (updateErr) {
          console.error('⚠️ Database order update error:', updateErr);
        } else {
          console.log('✅ Database order updated successfully:', updatedOrders);

          // Send confirmation emails after successful payment
          try {
            const orderRecord = updatedOrders && updatedOrders.length > 0 ? updatedOrders[0] : null;
            const customerEmail = orderRecord?.customer_email || valData.cus_email;
            const customerName = orderRecord?.customer_name || valData.cus_name || 'Customer';

            const lambdaUrl = process.env.LAMBDA_API_URL || process.env.VITE_LAMBDA_API_URL || '';
            const lambdaSecret = process.env.LAMBDA_SECRET || '';
            const adminEmail = (process.env.ADMIN_EMAIL || 'razinahmed60@gmail.com').trim();

            if (lambdaUrl && lambdaSecret) {
              // 1. Send Customer Email
              if (customerEmail) {
                await fetch(lambdaUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: 'Ximpul',
                    email: adminEmail,
                    to: customerEmail,
                    subject: `Payment Confirmed - Order #${actualOrderId} | Ximpul`,
                    source: 'Ximpul Flow',
                    secretKey: lambdaSecret,
                    htmlTemplate: `
                      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                        <h2 style="color: #10b981;">Payment Received & Order Confirmed!</h2>
                        <p>Dear ${customerName},</p>
                        <p>Your online payment of <strong>৳${totalAmount}</strong> for order <strong>#${actualOrderId}</strong> was successful.</p>
                        <p>We are processing your order for delivery.</p>
                        <p>Best regards,<br><strong>Ximpul Team</strong></p>
                      </div>
                    `
                  })
                });
              }

              // 2. Send Admin Email
              await fetch(lambdaUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: 'Ximpul Order Alert',
                  email: adminEmail,
                  to: adminEmail,
                  subject: `Payment Received - Order #${actualOrderId} | Ximpul`,
                  source: 'Ximpul Flow',
                  secretKey: lambdaSecret,
                  htmlTemplate: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                      <h2 style="color: #10b981;">Online Payment Received!</h2>
                      <p>Order <strong>#${actualOrderId}</strong> payment of ৳${totalAmount} has been verified.</p>
                      <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
                      <p><strong>Transaction ID:</strong> ${val_id}</p>
                    </div>
                  `
                })
              });
            }
          } catch (mailErr) {
            console.error('⚠️ Failed sending payment confirmation emails:', mailErr);
          }
        }

        return res.redirect(302, `${baseUrl}/thank-you?orderId=${encodeURIComponent(actualOrderId)}&totalAmount=${encodeURIComponent(totalAmount)}&paymentMethod=online`);
      } else {
        console.error('❌ SSLCommerz Validation failed. Result status:', valData?.status);
      }
    } catch (valErr) {
      console.error('❌ Exception during SSLCommerz validation:', valErr);
    }
  }

  // Fallback: If status is success parameter or verification succeeded without val_id
  if (statusParam === 'success' && orderId) {
    await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        order_status: 'processing',
      })
      .or(`order_id.eq.${orderId},id.eq.${orderId}`);

    return res.redirect(302, `${baseUrl}/thank-you?orderId=${encodeURIComponent(orderId)}&paymentMethod=online`);
  }

  return res.redirect(302, `${baseUrl}/thank-you?orderId=${encodeURIComponent(orderId || '')}&paymentMethod=online`);
}
