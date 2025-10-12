import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { sendOrderEmails } from '@/utils/emailjs-service';

export const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('tran_id'); // SSLCommerz sends tran_id
      
      if (!orderId) {
        navigate('/');
        return;
      }

      try {
        // 1. Update order status in database
        const { data: order, error } = await supabaseAdmin
          .from('orders')
          .update({ 
            payment_status: 'completed',
            order_status: 'confirmed'
          })
          .eq('id', orderId)
          .select()
          .single();

        if (error) throw error;

        // 2. Deduct stock for successful online payment
        console.log('Deducting stock for order:', order.order_id, 'Edition:', order.selected_edition, 'Color:', order.selected_color);
        console.log('Full order data:', order);
        
        const { data: editionData, error: editionError } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('edition', order.selected_edition)
          .single();

        console.log('Edition data:', editionData, 'Error:', editionError);

        if (!editionError && editionData) {
          const stockField = order.selected_color === 'obsidian' ? 'stock_black' : 'stock_grey';
          const currentStock = editionData[stockField] || 0;
          
          console.log('Current stock for', stockField, ':', currentStock);
          
          if (currentStock > 0) {
            const { error: updateError } = await supabaseAdmin
              .from('products')
              .update({ [stockField]: currentStock - 1 })
              .eq('edition', order.selected_edition);
            
            console.log('Stock update error:', updateError);
            
            // Log stock change
            const { error: logError } = await supabaseAdmin
              .from('stock_logs')
              .insert({
                item_id: editionData.id,
                item_type: 'product',
                item_name: order.selected_edition,
                color: order.selected_color,
                change_amount: -1,
                reason: `Online payment completed - Order ID: ${order.order_id}`,
                previous_stock: currentStock,
                new_stock: currentStock - 1
              });
            
            if (logError) {
              console.error('Stock log error:', logError);
            } else {
              console.log('Stock log created successfully for product:', order.selected_edition);
              console.log('Stock log data inserted:', {
                item_id: editionData.id,
                item_type: 'product',
                item_name: order.selected_edition,
                color: order.selected_color,
                change_amount: -1,
                reason: `Online payment completed - Order ID: ${order.order_id}`,
                previous_stock: currentStock,
                new_stock: currentStock - 1
              });
            }
          } else {
            console.log('Stock is 0 or negative, not deducting');
          }
        } else {
          console.log('Failed to fetch edition data or no data found');
        }

        // 3. Deduct accessory stock
        if (order.selected_accessories && order.selected_accessories.length > 0) {
          for (const accessoryName of order.selected_accessories) {
            const { data: accessoryData, error: accessoryError } = await supabaseAdmin
              .from('accessories')
              .select('*')
              .eq('name', accessoryName)
              .single();

            if (!accessoryError && accessoryData) {
              let stockField = 'stock_default';
              if (accessoryName.toLowerCase() === 'straw cap') {
                stockField = order.selected_color === 'obsidian' ? 'stock_black' : 'stock_grey';
              }
              
              const currentStock = accessoryData[stockField] || 0;
              if (currentStock > 0) {
                await supabaseAdmin
                  .from('accessories')
                  .update({ [stockField]: currentStock - 1 })
                  .eq('name', accessoryName);
                
                // Log accessory stock change
                const { error: accessoryLogError } = await supabaseAdmin
                  .from('stock_logs')
                  .insert({
                    item_id: accessoryData.id,
                    item_type: 'accessory',
                    item_name: accessoryName,
                    color: accessoryName.toLowerCase() === 'straw cap' ? order.selected_color : 'default',
                    change_amount: -1,
                    reason: `Online payment completed - Order ID: ${order.order_id}`,
                    previous_stock: currentStock,
                    new_stock: currentStock - 1
                  });
                
                if (accessoryLogError) {
                  console.error('Accessory stock log error:', accessoryLogError);
                } else {
                  console.log('Accessory stock log created successfully for:', accessoryName);
                }
              }
            }
          }
        }

        // 4. Send confirmation emails using direct API
        console.log('📧 Sending order emails for online payment...');
        try {
          const response = await fetch('https://ximpul.com:3002/send-order-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.order_id,
              customerName: order.customer_name,
              customerEmail: order.customer_email,
              customerPhone: order.customer_phone,
              customerAddress: order.customer_address,
              selectedEdition: order.selected_edition,
              selectedColor: order.selected_color,
              engravingText: order.engraving_text,
              totalAmount: order.total_amount,
              paymentMethod: order.payment_method
            })
          });
          
          const result = await response.json();
          if (result.success) {
            console.log('✅ Order emails sent successfully:', result);
          } else {
            console.error('❌ Email sending failed:', result.error);
          }
        } catch (error) {
          console.error('❌ Email sending error:', error);
        }

        // 5. Redirect to thank you page
        const searchParams = new URLSearchParams({
          orderId: order.id,
          paymentMethod: 'online',
          totalAmount: order.total_amount.toString()
        });
        
        navigate(`/thank-you?${searchParams.toString()}`);
      } catch (error) {
        console.error('Payment success handling failed:', error);
        navigate('/payment-failed');
      }
    };

    handlePaymentSuccess();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Processing Payment...</h2>
        <p>Please wait while we confirm your payment.</p>
      </div>
    </div>
  );
};
