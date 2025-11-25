import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sanitizeForLog = (data: any): string => {
  if (typeof data === 'string') {
    return data.replace(/[\r\n\t\x00-\x1f\x7f-\x9f]/g, ' ').replace(/[<>"'&]/g, '').substring(0, 100);
  }
  return String(data).replace(/[\r\n\t\x00-\x1f\x7f-\x9f]/g, ' ').replace(/[<>"'&]/g, '').substring(0, 100);
};

const sanitizeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    console.log('Received bulk order email request');

    const productsHtml = data.products.map((p: any) => 
      `<li>${sanitizeHtml(p.model)} - ${sanitizeHtml(p.color)} - Qty: ${sanitizeHtml(p.quantity)}</li>`
    ).join('');

    try {
      await fetch('http://202.59.208.114:3001/send-bulk-order-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
          customer_location: data.customerLocation,
          products: data.products,
          timeline: data.timeline,
          engraving: data.engraving,
          additional_message: data.additionalMessage
        })
      });
    } catch (emailError) {
      console.error('Error sending emails:', sanitizeForLog(emailError));
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", sanitizeForLog(error));
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
