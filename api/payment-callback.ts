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
