
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Clock, Phone, Home, FileText, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { sendEmail } from '@/utils/send-email';
interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  selected_edition: string;
  selected_color: string;
  payment_method: string;
  payment_status: string;
  total_amount: number;
  order_status: string;
  created_at: string;
  engraving_text: string | null;
}

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const [postData, setPostData] = useState<{orderId?: string, paymentMethod?: string, totalAmount?: string, type?: string}>({});
  
  // Get data from POST or GET (fallback)
  const orderId = postData.orderId || searchParams.get('orderId');
  const paymentMethod = postData.paymentMethod || searchParams.get('paymentMethod');
  const totalAmount = postData.totalAmount || searchParams.get('totalAmount') || searchParams.get('amount');
  const type = postData.type || searchParams.get('type'); // 'contact' or null (order)
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for POST data from sessionStorage
    const storedData = sessionStorage.getItem('thankYouPostData');
    if (storedData) {
      setPostData(JSON.parse(storedData));
      sessionStorage.removeItem('thankYouPostData');
    }
    
    window.scrollTo(0, 0);
    
    // Fetch order details if orderId exists
    const fetchOrderDetails = async () => {
      if (orderId && type !== 'contact') {
        setLoading(true);
        try {
          // Try to fetch by order_id first (numeric), then by id (UUID)
          let data, error;
          
          // Check if orderId is numeric (order_id) or UUID (id)
          if (/^\d+$/.test(orderId)) {
            // It's a numeric order_id
            const result = await supabase
              .from('orders')
              .select('*')
              .eq('order_id', orderId)
              .single();
            data = result.data;
            error = result.error;
          } else {
            // It's a UUID
            const result = await supabase
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .single();
            data = result.data;
            error = result.error;
          }

          if (error) {
            setOrder(null);
          } else {
            setOrder(data);
          }
        } catch (error) {
          setOrder(null);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, type]); // Removed 'order' to prevent multiple email sends
  
  // Separate useEffect for sending emails after order is loaded
  useEffect(() => {
    const sendOrderEmails = async () => {
      // Only send emails for COD orders OR completed online payments
      const shouldSendEmail = order && 
        ((order.payment_method === 'cod') || 
         (order.payment_method === 'online' && order.payment_status === 'completed')) &&
        !sessionStorage.getItem(`emailSent_${order.id}`);
      
      if (shouldSendEmail && order.payment_method === 'cod') {
        try {
          // Fetch email templates
          const { data: customerTemplate } = await supabase
            .from('email_templates')
            .select('*')
            .eq('type', 'order_customer')
            .single();
          
          const { data: adminTemplate } = await supabase
            .from('email_templates')
            .select('*')
            .eq('type', 'order_admin')
            .single();
          
          const { data: emailConfig } = await supabase
            .from('email_config')
            .select('*')
            .eq('config_type', 'customer');
          
          const paymentMethod = 'Cash on Delivery';
          
          // Send customer email
          if (order.customer_email && customerTemplate) {
            const customerEmailHTML = customerTemplate.template
              .replace(/\$\{customerName\}/g, order.customer_name)
              .replace(/\$\{orderId\}/g, order.order_id)
              .replace(/\$\{selectedEdition\}/g, order.selected_edition)
              .replace(/\$\{selectedColor\}/g, order.selected_color)
              .replace(/\$\{paymentMethod\}/g, paymentMethod)
              .replace(/\$\{totalAmount\}/g, order.total_amount.toString())
              .replace(/{{customerName}}/g, order.customer_name)
              .replace(/{{orderId}}/g, order.order_id)
              .replace(/{{selectedEdition}}/g, order.selected_edition)
              .replace(/{{selectedColor}}/g, order.selected_color)
              .replace(/{{paymentMethod}}/g, paymentMethod)
              .replace(/{{totalAmount}}/g, order.total_amount.toString());
            
            const customerSubject = customerTemplate.subject
              .replace(/\$\{orderId\}/g, order.order_id)
              .replace(/{{orderId}}/g, order.order_id);
            
            await sendEmail({
              to: order.customer_email,
              subject: customerSubject,
              message: customerEmailHTML,
              from_name: 'Ximpul Shop'
            });
          }
          
          // Send admin email
          if (adminTemplate && emailConfig && emailConfig.length > 0) {
            const config = emailConfig[0];
            const adminEmails = config?.to_emails?.join(',') || '';
            const ccEmails = config?.cc_emails?.join(',') || '';
            
            if (adminEmails) {
              const adminEmailHTML = adminTemplate.template
                .replace(/\$\{customerName\}/g, order.customer_name)
                .replace(/\$\{customerPhone\}/g, order.customer_phone)
                .replace(/\$\{customerEmail\}/g, order.customer_email || 'Not provided')
                .replace(/\$\{customerAddress\}/g, order.customer_address)
                .replace(/\$\{orderId\}/g, order.order_id)
                .replace(/\$\{selectedEdition\}/g, order.selected_edition)
                .replace(/\$\{selectedColor\}/g, order.selected_color)
                .replace(/\$\{engravingText\}/g, order.engraving_text || '')
                .replace(/\$\{paymentMethod\}/g, paymentMethod)
                .replace(/\$\{totalAmount\}/g, order.total_amount.toString())
                .replace(/{{customerName}}/g, order.customer_name)
                .replace(/{{customerPhone}}/g, order.customer_phone)
                .replace(/{{customerEmail}}/g, order.customer_email || 'Not provided')
                .replace(/{{customerAddress}}/g, order.customer_address)
                .replace(/{{orderId}}/g, order.order_id)
                .replace(/{{selectedEdition}}/g, order.selected_edition)
                .replace(/{{selectedColor}}/g, order.selected_color)
                .replace(/{{engravingText}}/g, order.engraving_text || '')
                .replace(/{{paymentMethod}}/g, paymentMethod)
                .replace(/{{totalAmount}}/g, order.total_amount.toString());
              
              const adminSubject = adminTemplate.subject
                .replace(/\$\{orderId\}/g, order.order_id)
                .replace(/{{orderId}}/g, order.order_id);
              
              await sendEmail({
                to: adminEmails,
                subject: adminSubject,
                message: adminEmailHTML,
                from_name: 'Ximpul Shop',
                cc: ccEmails || undefined
              });
            }
          }
          
          // Mark as sent
          sessionStorage.setItem(`emailSent_${order.id}`, 'true');
        } catch (error) {
          console.error('Error sending emails:', error);
        }
      }
    };
    
    sendOrderEmails();
  }, [order]); // Only run when order changes
  
  // Update page title and meta description
  useEffect(() => {
    if (type === 'contact') {
      document.title = "Message Sent - Thank You for Contacting Ximpul";
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Thank you for contacting Ximpul. We have received your message and will respond within 24 hours.');
      }
    } else {
      document.title = "Order Confirmed - Thank You for Choosing Ximpul Flow";
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Your Ximpul Flow order is confirmed. Track delivery, customer support, and next steps for your premium water bottle.');
      }
    }
    
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', 'https://ximpul.com/thank-you');
    }
  }, [type]);

  const isContactForm = type === 'contact';
  const displayOrderId = loading ? 'Loading...' : (order?.order_id || orderId || 'N/A');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navigation />
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            {isContactForm ? (
              <Mail className="h-10 w-10 text-green-600" />
            ) : (
              <CheckCircle className="h-10 w-10 text-green-600" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Thank You!
          </h1>
          <p className="text-base text-gray-600">
            {isContactForm 
              ? 'Your message has been sent successfully.'
              : 'Your Ximpul Flow order has been successfully placed.'
            }
          </p>
        </div>

        {/* Details Card */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            {isContactForm ? (
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Received</h2>
                <p className="text-gray-600 mb-4">
                  We have received your message and our team will get back to you within 24 hours.
                </p>
                <p className="text-sm text-gray-500">
                  A confirmation email has been sent to your email address.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Order Number:</span>
                    <span className="font-bold text-lg text-gray-900">{displayOrderId}</span>
                  </div>
                  {totalAmount && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 text-sm">Total Amount:</span>
                      <span className="font-bold text-lg text-gray-900">{parseInt(totalAmount).toLocaleString()} BDT</span>
                    </div>
                  )}
                  {paymentMethod && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 text-sm">Payment Method:</span>
                      <span className="font-medium text-gray-900 text-sm">
                        {paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* What's Next Section */}
        {!isContactForm && (
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">What happens next?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Package className="h-6 w-6 text-gray-700" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Order Processing</h4>
                  <p className="text-xs text-gray-600">We'll prepare your order</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-gray-700" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Delivery Time</h4>
                  <p className="text-xs text-gray-600">3-5 business days</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Phone className="h-6 w-6 text-gray-700" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Stay Updated</h4>
                  <p className="text-xs text-gray-600">We'll call with updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card className="mb-6 bg-gray-900 text-white">
          <CardContent className="p-4 text-center">
            <h3 className="text-base font-semibold mb-2">Need Help?</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-xs">
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <a href="tel:01881408611" className="text-white hover:underline">
                  01881408611
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <a href="mailto:ximpulshop@gmail.com" className="text-white hover:underline">
                  ximpulshop@gmail.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          {!isContactForm && displayOrderId !== 'N/A' && (
            <div>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                <Link to={`/track-order?orderId=${displayOrderId}`} className="flex items-center justify-center gap-2">
                  <Package className="h-4 w-4" />
                  Track Your Order
                </Link>
              </Button>
            </div>
          )}
          <div>
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white w-full sm:w-auto">
              <Link to="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                {isContactForm ? 'Back to Home' : 'Continue Shopping'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default ThankYou;
