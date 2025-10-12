import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Package, Calendar, CreditCard, Phone, Mail, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

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

export const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');
  const [searchValue, setSearchValue] = useState(urlOrderId || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const currentOrders = orders.slice(startIndex, startIndex + ordersPerPage);

  const OrderStatusBadge = ({ status }: { status: string }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      pending_payment: 'bg-orange-100 text-orange-800 border border-orange-300',
      processing: 'bg-blue-100 text-blue-800 border border-blue-300',
      shipped: 'bg-purple-100 text-purple-800 border border-purple-300',
      delivered: 'bg-green-100 text-green-800 border border-green-300',
      cancelled: 'bg-red-100 text-red-800 border border-red-300'
    };
    
    const formatStatus = (status: string) => {
      return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800 border border-gray-300'}`}>
        {formatStatus(status)}
      </span>
    );
  };

  const PaymentStatusBadge = ({ status }: { status: string }) => {
    const colors = {
      pending: 'bg-orange-100 text-orange-800 border border-orange-300',
      completed: 'bg-green-100 text-green-800 border border-green-300',
      failed: 'bg-red-100 text-red-800 border border-red-300',
      refunded: 'bg-gray-100 text-gray-800 border border-gray-300'
    };
    
    const formatStatus = (status: string) => {
      return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800 border border-gray-300'}`}>
        {formatStatus(status)}
      </span>
    );
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Please enter an Order ID or Phone Number');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      let query = supabase.from('orders').select('*');
      
      // Check if it's a phone number (11 digits) or order ID
      if (/^\d{11}$/.test(searchValue.trim())) {
        // Phone number search (11 digits)
        query = query.eq('customer_phone', searchValue.trim());
      } else if (/^\d+$/.test(searchValue.trim())) {
        // Order ID search (numeric but not 11 digits)
        query = query.eq('order_id', searchValue.trim());
      } else {
        // Try both order_id and phone for mixed searches
        query = query.or(`order_id.eq.${searchValue.trim()},customer_phone.eq.${searchValue.trim()}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching orders:', error);
        toast.error('Error searching orders');
        return;
      }

      setOrders(data || []);
      setCurrentPage(1);
      
      if (!data || data.length === 0) {
        toast.error('No orders found with the provided information');
      }

    } catch (err) {
      console.error('Search error:', err);
      toast.error('Error searching orders');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search when component loads with orderId in URL
  useEffect(() => {
    if (urlOrderId && !hasSearched) {
      handleSearch();
    }
  }, [urlOrderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-20">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-gray-800 to-black rounded-full mb-4 sm:mb-6">
            <Search className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3 sm:mb-4 px-4">Track Your Order</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">Enter your Order ID (e.g., 100011) or Phone Number (11 digits) to get real-time updates on your order status</p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 sm:mb-12 border-0 shadow-xl bg-white/80 backdrop-blur-sm mx-2 sm:mx-0">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">Order ID (e.g., 100011) or Phone Number (11 digits)</Label>
                <Input
                  id="search"
                  placeholder="Enter Order ID (e.g., 100011) or Phone Number (11 digits)"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-12 text-base sm:text-lg border-2 border-gray-200 focus:border-blue-500 transition-colors"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isLoading}
                className="h-12 w-full sm:w-auto sm:self-start px-6 sm:px-8 bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 text-white font-medium transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Searching...</span>
                    <span className="sm:hidden">Searching...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mx-2 sm:mx-0">
                <CardContent className="text-center py-12 sm:py-16 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-600 text-base sm:text-lg">Please check your Order ID or Phone Number and try again.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 sm:mb-6 px-2 sm:px-0">
                  <p className="text-sm sm:text-base text-gray-600">Showing {startIndex + 1}-{Math.min(startIndex + ordersPerPage, orders.length)} of {orders.length} orders</p>
                </div>
                {currentOrders.map((order) => (
                <Card key={order.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-white/90 backdrop-blur-sm overflow-hidden mx-2 sm:mx-0 mb-4">
                  <div className="bg-gradient-to-r from-gray-800 to-black h-1"></div>
                  <CardContent className="p-4 sm:p-6">
                    <div className="mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{order.customer_name}</h3>
                          <div className="bg-gray-100 px-2.5 py-1.5 rounded-md mt-2 inline-block">
                            <p className="text-xs font-semibold text-gray-800">Order ID: #{order.order_id}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="text-xs font-medium text-gray-500 mb-2">Order Status</h4>
                          <OrderStatusBadge status={order.order_status} />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <h4 className="text-xs font-medium text-gray-500 mb-2">Payment Status</h4>
                          <PaymentStatusBadge status={order.payment_status} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div className="bg-gray-50 p-2.5 rounded-md">
                        <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium text-xs">Date</span>
                        </div>
                        <p className="text-gray-900 text-xs font-medium">
                          {new Date(order.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-2.5 rounded-md">
                        <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium text-xs">Phone</span>
                        </div>
                        <p className="text-gray-900 text-xs font-medium break-all sm:break-normal">{order.customer_phone}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-2.5 rounded-md">
                        <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                          <Package className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium text-xs">Product</span>
                        </div>
                        <p className="text-gray-900 text-xs font-medium capitalize">{order.selected_edition.replace(/_/g, ' ')} - {order.selected_color.replace(/_/g, ' ')}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-2.5 rounded-md">
                        <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                          <CreditCard className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium text-xs">Amount</span>
                        </div>
                        <p className="font-bold text-gray-900 text-xs">{order.total_amount.toLocaleString()} BDT</p>
                      </div>
                    </div>
                    
                    {(order.customer_address || order.engraving_text) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                        {order.customer_address && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-xs block">Delivery Address</span>
                              <p className="text-gray-900 text-xs mt-1">{order.customer_address}</p>
                            </div>
                          </div>
                        )}
                        {order.engraving_text && (
                          <div className="flex items-start gap-2 text-gray-600">
                            <Package className="h-3 w-3 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-medium text-xs block">Engraving Text</span>
                              <p className="text-gray-900 text-xs mt-1 font-mono bg-gray-50 px-2 py-1 rounded">"{order.engraving_text}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-6 sm:mt-8 px-2 sm:px-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 w-full sm:w-auto"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>
                    
                    <div className="flex gap-1 flex-wrap justify-center">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 p-0 ${currentPage === page ? "bg-gradient-to-r from-gray-800 to-black" : ""}`}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 w-full sm:w-auto"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};