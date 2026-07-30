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

async function createSteadfastParcel(supabase: any, orderRecord: any) {
  if (!orderRecord || orderRecord.tracking_number) {
    return orderRecord?.tracking_number || null;
  }

  try {
    const { data: vendors } = await supabase
      .from('courier_vendors')
      .select('*')
      .eq('type', 'steadfast')
      .eq('status', 'active')
      .limit(1);

    if (!vendors || vendors.length === 0) {
      console.warn('⚠️ Steadfast auto-creation skipped: No active vendor found.');
      return null;
    }

    const steadfastVendor = vendors[0];
    if (!steadfastVendor.api_key || !steadfastVendor.secret_key) {
      console.warn('⚠️ Steadfast auto-creation skipped: API credentials missing.');
      return null;
    }

    const codAmount = orderRecord.payment_method === 'online' ? 0 : orderRecord.total_amount;
    const colorLabel = orderRecord.selected_color === 'obsidian' ? 'Obsidian Black' : (orderRecord.selected_color || 'Graphite Grey');
    const engravingPart = orderRecord.engraving_text ? ` - Engraved: "${orderRecord.engraving_text}"` : '';

    const steadfastData = {
      invoice: orderRecord.order_id,
      recipient_name: orderRecord.customer_name,
      recipient_phone: orderRecord.customer_phone,
      recipient_address: orderRecord.customer_address,
      cod_amount: codAmount,
      note: `Ximpul Flow - ${orderRecord.selected_edition} - ${colorLabel}${engravingPart}`
    };

    const baseUrl = (steadfastVendor.base_url || 'https://portal.packzy.com/api/v1').replace(/\/+$/, '');
    const apiUrl = `${baseUrl}/create_order`;

    console.log(`📦 Creating Steadfast parcel for order #${orderRecord.order_id}...`);

    const sfRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Api-Key': steadfastVendor.api_key,
        'Secret-Key': steadfastVendor.secret_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(steadfastData)
    });

    const sfResult = await sfRes.json();
    console.log('📦 Steadfast API response:', sfResult);

    if (sfResult && (sfResult.status === 200 || sfResult.status === '200') && sfResult.consignment) {
      const consignmentId = String(sfResult.consignment.consignment_id);
      console.log(`✅ Steadfast parcel created! Consignment ID: ${consignmentId}`);

      // Update tracking number in database
      await supabase
        .from('orders')
        .update({ tracking_number: consignmentId })
        .eq('id', orderRecord.id);

      orderRecord.tracking_number = consignmentId;
      return consignmentId;
    } else {
      console.error('❌ Steadfast parcel creation failed:', sfResult);
    }
  } catch (sfErr) {
    console.error('⚠️ Steadfast parcel creation exception:', sfErr);
  }
  return null;
}

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

  // 3. Auto-Create Steadfast Parcel for completed online order
  if (updatedOrder) {
    await createSteadfastParcel(supabase, updatedOrder);
  }

  // 4. Dispatch Notification Emails using the exact same DB templates as COD
  if (updatedOrder || isPaymentVerified || statusParam === 'success') {
    try {
      const orderRecord = updatedOrder || {};
      const orderCode = orderRecord.order_id || orderId;
      const customerName = orderRecord.customer_name || params.cus_name || 'Customer';
      const customerPhone = orderRecord.customer_phone || params.cus_phone || '';
      const customerEmail = orderRecord.customer_email || params.cus_email || '';
      const customerAddress = orderRecord.customer_address || params.cus_add1 || '';
      const selectedEdition = orderRecord.selected_edition || 'Standard';
      const selectedColor = orderRecord.selected_color || 'Standard';
      const engravingText = orderRecord.engraving_text || 'None';
      const paymentMethodLabel = 'Online Payment';
      const totalAmount = (orderRecord.total_amount || params.amount || '0').toString();

      // Fetch Email Templates & Config from Supabase
      const { data: customerTemplate } = await supabase
        .from('email_templates')
        .select('*')
        .eq('type', 'order_customer')
        .maybeSingle();

      const { data: adminTemplate } = await supabase
        .from('email_templates')
        .select('*')
        .eq('type', 'order_admin')
        .maybeSingle();

      const { data: emailConfig } = await supabase
        .from('email_config')
        .select('*')
        .eq('config_type', 'customer');

      let adminEmails = (process.env.ADMIN_EMAIL || 'ximpulshop@gmail.com').trim();
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

      const lambdaUrl = process.env.LAMBDA_API_URL || process.env.VITE_LAMBDA_API_URL || 'https://sohub.com.bd/api/send-email';
      const lambdaSecret = process.env.LAMBDA_SECRET || process.env.VITE_LAMBDA_SECRET || 'sohub-mailer-secret-2026';

      console.log(`📧 Dispatching template-based emails for order #${orderCode}...`);

      // 1. Send Customer Email
      if (customerEmail && lambdaUrl) {
        let customerSubject = `Order Confirmation #${orderCode} | Ximpul`;
        let customerHTML = '';

        if (customerTemplate) {
          customerSubject = customerTemplate.subject
            .replace(/\$\{orderId\}/g, orderCode)
            .replace(/{{orderId}}/g, orderCode);

          customerHTML = customerTemplate.template
            .replace(/\$\{customerName\}/g, customerName)
            .replace(/\$\{customerPhone\}/g, customerPhone)
            .replace(/\$\{customerEmail\}/g, customerEmail || 'Not provided')
            .replace(/\$\{customerAddress\}/g, customerAddress)
            .replace(/\$\{orderId\}/g, orderCode)
            .replace(/\$\{selectedEdition\}/g, selectedEdition)
            .replace(/\$\{selectedColor\}/g, selectedColor)
            .replace(/\$\{engravingText\}/g, engravingText)
            .replace(/\$\{paymentMethod\}/g, paymentMethodLabel)
            .replace(/\$\{totalAmount\}/g, totalAmount)
            .replace(/{{customerName}}/g, customerName)
            .replace(/{{customerPhone}}/g, customerPhone)
            .replace(/{{customerEmail}}/g, customerEmail || 'Not provided')
            .replace(/{{customerAddress}}/g, customerAddress)
            .replace(/{{orderId}}/g, orderCode)
            .replace(/{{selectedEdition}}/g, selectedEdition)
            .replace(/{{selectedColor}}/g, selectedColor)
            .replace(/{{engravingText}}/g, engravingText)
            .replace(/{{paymentMethod}}/g, paymentMethodLabel)
            .replace(/{{totalAmount}}/g, totalAmount);
        } else {
          customerHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2>Thank You for Your Order!</h2>
              <p>Dear ${customerName},</p>
              <p>We have successfully received your order <strong>#${orderCode}</strong>.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3>Order Summary</h3>
                <p><strong>Order ID:</strong> #${orderCode}</p>
                <p><strong>Edition:</strong> ${selectedEdition}</p>
                <p><strong>Color:</strong> ${selectedColor}</p>
                <p><strong>Payment Method:</strong> ${paymentMethodLabel}</p>
                <p><strong>Total Amount:</strong> ৳${totalAmount}</p>
              </div>
              <p>We will process your order shortly.</p>
              <p>Best regards,<br><strong>Ximpul Team</strong></p>
            </div>
          `;
        }

        await fetch(lambdaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Ximpul',
            email: adminEmails.split(',')[0] || 'razinahmed60@gmail.com',
            to: customerEmail,
            subject: customerSubject,
            source: 'Ximpul Flow',
            secretKey: lambdaSecret,
            htmlTemplate: customerHTML,
          })
        }).catch(e => console.error('Customer mail fetch error:', e));
      }

      // 2. Send Admin Email
      if (lambdaUrl) {
        let adminSubject = `New Order Received: #${orderCode} | Ximpul`;
        let adminHTML = '';

        if (adminTemplate) {
          adminSubject = adminTemplate.subject
            .replace(/\$\{orderId\}/g, orderCode)
            .replace(/{{orderId}}/g, orderCode);

          adminHTML = adminTemplate.template
            .replace(/\$\{customerName\}/g, customerName)
            .replace(/\$\{customerPhone\}/g, customerPhone)
            .replace(/\$\{customerEmail\}/g, customerEmail || 'Not provided')
            .replace(/\$\{customerAddress\}/g, customerAddress)
            .replace(/\$\{orderId\}/g, orderCode)
            .replace(/\$\{selectedEdition\}/g, selectedEdition)
            .replace(/\$\{selectedColor\}/g, selectedColor)
            .replace(/\$\{engravingText\}/g, engravingText)
            .replace(/\$\{paymentMethod\}/g, paymentMethodLabel)
            .replace(/\$\{totalAmount\}/g, totalAmount)
            .replace(/{{customerName}}/g, customerName)
            .replace(/{{customerPhone}}/g, customerPhone)
            .replace(/{{customerEmail}}/g, customerEmail || 'Not provided')
            .replace(/{{customerAddress}}/g, customerAddress)
            .replace(/{{orderId}}/g, orderCode)
            .replace(/{{selectedEdition}}/g, selectedEdition)
            .replace(/{{selectedColor}}/g, selectedColor)
            .replace(/{{engravingText}}/g, engravingText)
            .replace(/{{paymentMethod}}/g, paymentMethodLabel)
            .replace(/{{totalAmount}}/g, totalAmount);
        } else {
          adminHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2>New Order Alert!</h2>
              <p>A new order <strong>#${orderCode}</strong> has been placed on Ximpul.</p>
              <div style="background-color: #f4f4f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3>Order & Customer Details</h3>
                <p><strong>Order ID:</strong> #${orderCode}</p>
                <p><strong>Customer Name:</strong> ${customerName}</p>
                <p><strong>Phone:</strong> ${customerPhone}</p>
                <p><strong>Email:</strong> ${customerEmail || 'Not provided'}</p>
                <p><strong>Address:</strong> ${customerAddress}</p>
                <p><strong>Edition:</strong> ${selectedEdition}</p>
                <p><strong>Color:</strong> ${selectedColor}</p>
                <p><strong>Engraving:</strong> ${engravingText}</p>
                <p><strong>Payment Method:</strong> ${paymentMethodLabel}</p>
                <p><strong>Total Amount:</strong> ৳${totalAmount}</p>
              </div>
            </div>
          `;
        }

        const adminTargets = adminEmails.split(',').map(e => e.trim()).filter(Boolean);
        for (const targetAdminEmail of adminTargets) {
          await fetch(lambdaUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Ximpul Order Alert',
              email: targetAdminEmail,
              to: targetAdminEmail,
              subject: adminSubject,
              source: 'Ximpul Flow',
              secretKey: lambdaSecret,
              htmlTemplate: adminHTML,
              cc: ccEmails || undefined,
            })
          }).catch(e => console.error('Admin mail fetch error:', e));
        }
      }
    } catch (mailErr) {
      console.error('⚠️ Exception sending payment emails:', mailErr);
    }

    return res.redirect(302, `${baseUrl}/thank-you?orderId=${encodeURIComponent(orderId)}&paymentMethod=online`);
  }

  return res.redirect(302, `${baseUrl}/thank-you?orderId=${encodeURIComponent(orderId)}&paymentMethod=online`);
}
