import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrders, Order } from '@/hooks/useOrders';
import { 
  User, Mail, Phone, Package, Search, RefreshCw, 
  Calendar, MapPin, ShoppingBag, ChevronRight, Eye,
  ChevronLeft, Filter, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  name: string;
  phone: string;
  email: string | null;
  address: string;
  orders: Order[];
  totalSpent: number;
  lastOrderDate: string;
}

export const AdminCustomers = () => {
  const { orders, isLoading, fetchOrders } = useOrders();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Process orders to get unique customers
  useEffect(() => {
    if (!orders.length) return;

    const customerMap = new Map<string, Customer>();
    
    orders.forEach(order => {
      const phone = order.customer_phone;
      
      if (customerMap.has(phone)) {
        // Add order to existing customer
        const customer = customerMap.get(phone)!;
        customer.orders.push(order);
        customer.totalSpent += order.total_amount;
        
        // Update last order date if this order is more recent
        const orderDate = new Date(order.created_at);
        const lastOrderDate = new Date(customer.lastOrderDate);
        if (orderDate > lastOrderDate) {
          customer.lastOrderDate = order.created_at;
        }
      } else {
        // Create new customer
        customerMap.set(phone, {
          name: order.customer_name,
          phone: order.customer_phone,
          email: order.customer_email,
          address: order.customer_address,
          orders: [order],
          totalSpent: order.total_amount,
          lastOrderDate: order.created_at
        });
      }
    });
    
    // Convert map to array and sort by most recent order
    const customersArray = Array.from(customerMap.values());
    customersArray.sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());
    
    setCustomers(customersArray);
  }, [orders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      customer.address.toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const exportCustomers = () => {
    const data = filteredCustomers.map(customer => ({
      'Name': customer.name,
      'Phone': customer.phone,
      'Email': customer.email || '',
      'Address': customer.address.replace(/\n/g, ' '),
      'Total Orders': customer.orders.length,
      'Total Spent (BDT)': customer.totalSpent,
      'Last Order Date': new Date(customer.lastOrderDate).toLocaleDateString(),
      'Customer Since': new Date(customer.orders[customer.orders.length - 1].created_at).toLocaleDateString()
    }));

    const headers = Object.keys(data[0] || {});
    const csvContent = [headers, ...data.map(row => headers.map(h => row[h]))]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ximpul-customers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Customer list exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-lg font-medium">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
              <p className="text-gray-600">View and manage your customer base efficiently</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={exportCustomers}
                variant="outline" 
                className="flex items-center gap-2 h-10 px-4 border-gray-300 hover:bg-gray-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </Button>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="flex items-center gap-2 h-10 px-4 border-gray-300 hover:bg-gray-50"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Customers</p>
                  <p className="text-3xl font-bold text-blue-800">{customers.length}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <User className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Orders</p>
                  <p className="text-3xl font-bold text-green-800">{orders.filter(o => o.order_status !== 'pending_payment' && o.order_status !== 'cancelled').length}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <Package className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Revenue</p>
                  <p className="text-3xl font-bold text-purple-800">
                    {orders.filter(o => o.order_status !== 'pending_payment' && o.order_status !== 'cancelled').reduce((sum, order) => sum + order.total_amount, 0).toLocaleString()} BDT
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Search Customers</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers by name, phone, email, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Customer List</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
                </p>
              </div>
              {filteredCustomers.length > itemsPerPage && (
                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-md border border-gray-200">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
                </div>
              )}
            </div>
          </div>
          <div className="p-6">
          <div className="space-y-4">
            {paginatedCustomers.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search to find what you're looking for.</p>
              </div>
            ) : (
              paginatedCustomers.map((customer, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-medium">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">{customer.name}</h3>
                          <p className="text-sm text-gray-500">{customer.orders.length} order{customer.orders.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 mb-1">
                            <User className="h-3.5 w-3.5" />
                            <span>Contact</span>
                          </div>
                          <p className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span>{customer.phone}</span>
                          </p>
                          {customer.email && (
                            <p className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              <span>{customer.email}</span>
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 mb-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Address</span>
                          </div>
                          <p className="text-sm line-clamp-2">{customer.address}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1 text-gray-500 mb-1">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            <span>Purchase History</span>
                          </div>
                          <p className="font-medium">{customer.totalSpent.toLocaleString()} BDT</p>
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            Last order: {new Date(customer.lastOrderDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Customer Details</DialogTitle>
                            <DialogDescription>View complete customer information and order history</DialogDescription>
                          </DialogHeader>
                          {selectedCustomer && (
                            <Tabs defaultValue="info">
                              <TabsList className="grid grid-cols-2 mb-4">
                                <TabsTrigger value="info">Customer Info</TabsTrigger>
                                <TabsTrigger value="orders">Order History</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="info">
                                <Card>
                                  <CardHeader>
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-medium text-lg">
                                        {selectedCustomer.name.charAt(0)}
                                      </div>
                                      <div>
                                        <CardTitle>{selectedCustomer.name}</CardTitle>
                                        <CardDescription>
                                          Customer since {new Date(selectedCustomer.orders[selectedCustomer.orders.length - 1].created_at).toLocaleDateString()}
                                        </CardDescription>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Phone className="h-4 w-4 text-gray-400" />
                                              <span>{selectedCustomer.phone}</span>
                                            </div>
                                            {selectedCustomer.email && (
                                              <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                <span>{selectedCustomer.email}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h4>
                                          <div className="flex items-start gap-2 bg-gray-50 p-3 rounded">
                                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                            <span className="whitespace-pre-wrap">{selectedCustomer.address}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-500 mb-2">Purchase Summary</h4>
                                          <div className="bg-gray-50 p-4 rounded space-y-2">
                                            <div className="flex justify-between">
                                              <span>Total Orders:</span>
                                              <span className="font-medium">{selectedCustomer.orders.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Total Spent:</span>
                                              <span className="font-medium">{selectedCustomer.totalSpent.toLocaleString()} BDT</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Average Order Value:</span>
                                              <span className="font-medium">
                                                {(selectedCustomer.totalSpent / selectedCustomer.orders.length).toLocaleString()} BDT
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span>Last Order Date:</span>
                                              <span className="font-medium">
                                                {new Date(selectedCustomer.lastOrderDate).toLocaleDateString()}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-500 mb-2">Most Recent Purchase</h4>
                                          {selectedCustomer.orders.length > 0 && (
                                            <div className="bg-gray-50 p-4 rounded space-y-2">
                                              <div className="flex justify-between">
                                                <span>Product:</span>
                                                <span className="font-medium">{selectedCustomer.orders[0].selected_edition} Edition</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Color:</span>
                                                <span className="font-medium">{selectedCustomer.orders[0].selected_color}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Amount:</span>
                                                <span className="font-medium">{selectedCustomer.orders[0].total_amount.toLocaleString()} BDT</span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span>Date:</span>
                                                <span className="font-medium">
                                                  {new Date(selectedCustomer.orders[0].created_at).toLocaleDateString()}
                                                </span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                              
                              <TabsContent value="orders">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Order History</CardTitle>
                                    <CardDescription>
                                      {selectedCustomer.orders.length} order{selectedCustomer.orders.length !== 1 ? 's' : ''} placed by this customer
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      {selectedCustomer.orders.map((order, idx) => (
                                        <div key={order.id} className="border rounded p-4 hover:bg-gray-50 transition-colors">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium">Order #{idx + 1}</span>
                                                <span className="text-xs text-gray-500">{order.id.slice(0, 8)}...</span>
                                              </div>
                                              <p className="text-sm">
                                                <span className="font-medium">{order.selected_edition} Edition</span> - {order.selected_color}
                                              </p>
                                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(order.created_at).toLocaleDateString('en-US', { 
                                                  year: 'numeric', 
                                                  month: 'short', 
                                                  day: 'numeric'
                                                })}
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-medium">{order.total_amount.toLocaleString()} BDT</p>
                                              <p className="text-xs mt-1 px-2 py-1 rounded-full bg-gray-100 inline-block">
                                                {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                  <CardFooter className="flex justify-center border-t pt-4">
                                    <Button variant="outline" size="sm" className="w-full max-w-xs">
                                      View All Orders <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                  </CardFooter>
                                </Card>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
