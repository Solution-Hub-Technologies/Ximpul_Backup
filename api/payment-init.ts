import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const store_id = process.env.SSLCOMMERZ_STORE_ID;
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const is_live = process.env.SSLCOMMERZ_IS_LIVE !== 'false';

    if (!store_id || !store_passwd) {
      console.error('SSLCommerz configuration missing: SSLCOMMERZ_STORE_ID or SSLCOMMERZ_STORE_PASSWORD not set');
      return res.status(500).json({ success: false, error: 'Payment gateway configuration is missing on server' });
    }

    const {
      orderId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      totalAmount,
    } = req.body || {};

    if (!orderId || !customerName || !totalAmount) {
      return res.status(400).json({ success: false, error: 'Missing required order fields' });
    }

    // Determine current protocol and host for callback URLs
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'ximpul.com';
    const baseUrl = `${protocol}://${host}`;

    const callbackUrl = `${baseUrl}/api/payment-callback?orderId=${encodeURIComponent(orderId)}`;

    const formData = new URLSearchParams();
    formData.append('store_id', store_id);
    formData.append('store_passwd', store_passwd);
    formData.append('total_amount', String(totalAmount));
    formData.append('currency', 'BDT');
    formData.append('tran_id', String(orderId));

    formData.append('success_url', `${callbackUrl}&status=success`);
    formData.append('fail_url', `${callbackUrl}&status=fail`);
    formData.append('cancel_url', `${callbackUrl}&status=cancel`);

    formData.append('cus_name', customerName || 'Customer');
    formData.append('cus_email', customerEmail || `customer_${orderId}@ximpul.com`);
    formData.append('cus_add1', customerAddress || 'Dhaka');
    formData.append('cus_phone', customerPhone || '01700000000');
    formData.append('cus_city', 'Dhaka');
    formData.append('cus_country', 'Bangladesh');

    formData.append('ship_name', customerName || 'Customer');
    formData.append('ship_add1', customerAddress || 'Dhaka');
    formData.append('ship_city', 'Dhaka');
    formData.append('ship_state', 'Dhaka');
    formData.append('ship_postcode', '1000');
    formData.append('ship_country', 'Bangladesh');

    formData.append('shipping_method', 'Courier');
    formData.append('product_name', 'Ximpul Flow Water Bottle');
    formData.append('product_category', 'Physical');
    formData.append('product_profile', 'physical-goods');

    const apiEndpoint = is_live
      ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
      : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

    console.log(`💳 Initializing SSLCommerz session for order #${orderId}...`);

    const sslRes = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const sslData = await sslRes.json();

    if (sslData && sslData.status === 'SUCCESS' && sslData.GatewayPageURL) {
      console.log('✅ SSLCommerz session created successfully:', sslData.GatewayPageURL);
      return res.status(200).json({
        success: true,
        url: sslData.GatewayPageURL,
        sessionkey: sslData.sessionkey,
      });
    } else {
      console.error('❌ SSLCommerz session creation failed:', sslData);
      return res.status(400).json({
        success: false,
        error: sslData.failedreason || 'Failed to generate payment URL from SSLCommerz',
      });
    }
  } catch (error: any) {
    console.error('❌ Error initializing payment:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Server error initializing payment' });
  }
}
