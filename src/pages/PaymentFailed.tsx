
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const tranId = searchParams.get('tran_id');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Failed
        </h1>
        
        <p className="text-gray-600 mb-6">
          We couldn't process your payment. Please try again or contact our support team.
        </p>

        {tranId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Transaction Reference</p>
            <p className="font-mono text-sm font-medium text-gray-900">{tranId}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-2">Need help? Contact us:</p>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">
              <a href="mailto:ximpulshop@gmail.com" className="text-blue-600 hover:underline">
                ximpulshop@gmail.com
              </a>
            </p>
            <p className="text-sm font-medium text-gray-900">
              <a href="tel:01881408611" className="text-blue-600 hover:underline">
                01881408611
              </a>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full bg-gray-900 hover:bg-black text-white">
            <Link to="/#buy" onClick={() => window.scrollTo(0, 0)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full hover:bg-black hover:text-white">
            <Link to="/" onClick={() => window.scrollTo(0, 0)}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full hover:bg-black hover:text-white">
            <Link to="/contact" onClick={() => window.scrollTo(0, 0)}>
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
