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

        // 2. Stock deduction is handled by payment-success.php to avoid double deduction
        console.log('Stock deduction handled by payment-success.php for order:', order.order_id);

        // 3. Send confirmation emails using direct API
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

        // 4. Redirect to thank you page
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
