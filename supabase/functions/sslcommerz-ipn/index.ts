
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const val_id = formData.get('val_id')?.toString();
    const tran_id = formData.get('tran_id')?.toString();
    const status = formData.get('status')?.toString();
    const amount = formData.get('amount')?.toString();

    console.log('SSLCommerz IPN received:', { val_id, tran_id, status, amount });

    // Verify the transaction with SSLCommerz
    const store_id = Deno.env.get("SSLCOMMERZ_STORE_ID") || 'solut660bb9fa34eb5';
    const store_passwd = Deno.env.get("SSLCOMMERZ_STORE_PASSWORD") || 'solut660bb9fa34eb5@ssl';
    const is_live = Deno.env.get("SSLCOMMERZ_IS_LIVE") === 'true';

    const validationUrl = is_live
      ? `https://securepay.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&format=json`
      : `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${store_id}&store_passwd=${store_passwd}&format=json`;

    const validationResponse = await fetch(validationUrl);
    const validationResult = await validationResponse.json();

    console.log('SSLCommerz validation result:', validationResult);

    if (validationResult.status === 'VALID' || validationResult.status === 'VALIDATED') {
      // Update order status in database
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const { data, error } = await supabase
        .from('orders')
        .update({ 
          order_status: 'paid',
          payment_transaction_id: val_id
        })
        .eq('id', tran_id)
        .select();

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Order updated successfully for transaction:', tran_id, 'Data:', data);
    } else {
      console.log('Transaction validation failed:', validationResult);
    }

    return new Response('IPN received', {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error('IPN processing error:', error);
    return new Response('IPN processing failed', {
      headers: corsHeaders,
      status: 500,
    });
  }
});
