import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, newStatus, adminId, notes } = await req.json()

    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    const shouldDeductStock = (newStatus === 'shipped' || newStatus === 'delivered') && 
                             orderData.payment_method === 'cod' && 
                             !['shipped', 'delivered'].includes(orderData.order_status) &&
                             orderData.payment_status !== 'completed'

    const updateData = {
      order_status: newStatus,
      admin_notes: notes || null,
      ...(shouldDeductStock && { payment_status: 'completed' })
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) throw updateError

    if (shouldDeductStock) {
      const { data: editionData } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('edition', orderData.selected_edition)
        .single()

      if (editionData) {
        const stockField = orderData.selected_color === 'obsidian' ? 'stock_black' : 'stock_grey'
        const currentStock = editionData[stockField] || 0

        if (currentStock > 0) {
          await supabaseAdmin
            .from('products')
            .update({ [stockField]: currentStock - 1 })
            .eq('edition', orderData.selected_edition)

          await supabaseAdmin
            .from('stock_logs')
            .insert({
              item_id: editionData.id,
              item_type: 'product',
              item_name: orderData.selected_edition,
              color: orderData.selected_color,
              change_amount: -1,
              reason: `Order ${newStatus} - Order ID: ${orderData.order_id}`,
              previous_stock: currentStock,
              new_stock: currentStock - 1
            })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, stockDeducted: shouldDeductStock }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})