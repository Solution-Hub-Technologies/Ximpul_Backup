import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Phone, Mail, Home, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const PaymentError = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Payment Error - Ximpul";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navigation />
      <div className="pt-20 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Payment Temporarily Unavailable
            </h1>
            <p className="text-base text-gray-600">
              We're experiencing a technical issue. Please try an alternative option.
            </p>
          </div>

          {/* Alternative Options */}
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Alternative Options</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Cash on Delivery</h4>
                  <p className="text-xs text-gray-600 mb-3">Pay when your order arrives</p>
                  <Link to="/">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-xs">
                      Place COD Order
                    </Button>
                  </Link>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Contact Us</h4>
                  <p className="text-xs text-gray-600 mb-3">Get in touch for assistance</p>
                  <Link to="/contact">
                    <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50 text-xs">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Action Button */}
          <div className="text-center">
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white w-full sm:w-auto">
              <Link to="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};