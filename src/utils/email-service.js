/**
 * Send order confirmation emails to customer and admin
 * @param order The order data
 */
export const sendOrderEmails = async (order) => {
  try {
    console.log('Sending order emails for:', order.id);
    
    // Use direct fetch to our local email server
    const response = await fetch('http://localhost:3001/api/send-order-emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: order.id,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        selectedEdition: order.selected_edition,
        selectedColor: order.selected_color,
        totalAmount: order.total_amount,
        paymentMethod: order.payment_method
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error sending order emails:', data);
      return { success: false, error: data.error };
    }

    console.log('Order emails sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending order emails:', error);
    return { success: false, error };
  }
};