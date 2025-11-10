import React from 'react';
import { supabase } from '@/integrations/supabase/client';

export const DebugPayment = () => {
  const testConnection = async () => {
    console.log('🔍 Testing Supabase connection...');
    
    try {
      const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true });
      console.log('✅ Supabase connection OK:', { data, error });
    } catch (err) {
      console.error('❌ Supabase connection failed:', err);
    }
  };

  const testPaymentFunction = async () => {
    console.log('🔍 Testing payment function...');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-sslcommerz-payment', {
        body: {
          customerName: 'Test User',
          customerPhone: '01700000000',
          customerEmail: 'test@example.com',
          customerAddress: 'Test Address',
          totalAmount: 100,
          orderId: 'test-order-123'
        }
      });
      
      console.log('Payment function response:', { data, error });
    } catch (err) {
      console.error('❌ Payment function failed:', err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 border rounded shadow-lg z-50">
      <h3 className="font-bold mb-2">Debug Tools</h3>
      <button 
        onClick={testConnection}
        className="block w-full mb-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
      >
        Test DB Connection
      </button>
      <button 
        onClick={testPaymentFunction}
        className="block w-full px-3 py-1 bg-green-500 text-white rounded text-sm"
      >
        Test Payment Function
      </button>
    </div>
  );
};