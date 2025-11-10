import { sanitizeForLog } from './security';

// Mock payment function for local development
export const mockSSLCommerzPayment = async (orderData: any) => {
  console.log('🔧 Using MOCK payment function for local development');
  console.log('Order data:', sanitizeForLog(JSON.stringify(orderData)));
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock successful response
  return {
    data: {
      success: true,
      //gatewayPageURL: `https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q=PAY&SESSIONKEY=mock-session-${Date.now()}`
      gatewayPageURL: `https://securepay.sslcommerz.com/gwprocess/v4/gw.php?Q=PAY&SESSIONKEY=mock-session-${Date.now()}`
    },
    error: null
  };
};
