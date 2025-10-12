import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useOrders, Order } from '@/hooks/useOrders';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { 
  Eye, Copy, RefreshCw, Search, Filter, Calendar, 
  Package, Truck, CheckCircle, AlertTriangle, Clock, 
  CreditCard, MapPin, FileText, User, Phone, Mail, 
  X, ArrowUpRight, Trash2, Shield, ChevronLeft, ChevronRight,
  Download, FileSpreadsheet, FileText as FilePdf, Printer, Receipt,
  Banknote, Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

const ColorBadge = ({ color }: { color: string }) => {
  if (color === 'obsidian') {
    return (
      <div className="flex items-center gap-1 px-3 py-1 bg-black rounded-full border-2 border-gray-800">
        <div className="w-2 h-2 rounded-full bg-white"></div>
        <span className="text-white text-xs font-bold">OBSIDIAN BLACK</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 px-3 py-1 bg-slate-500 rounded-full border-2 border-slate-400">
      <div className="w-2 h-2 rounded-full bg-white"></div>
      <span className="text-white text-xs font-bold">GRAPHITE GREY</span>
    </div>
  );
};

export const AdminOrders = () => {
  const { orders, isLoading, updateOrderStatus, updatePaymentStatus, updateTrackingInfo, fetchOrders, deleteOrder } = useOrders();
  const { adminUser } = useAdminAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [activeStatusTab, setActiveStatusTab] = useState('all_status');
  const [privacyFilter, setPrivacyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{orderId: string, newStatus: string} | null>(null);
  const [paymentStatusNotes, setPaymentStatusNotes] = useState('');
  const [isPaymentStatusDialogOpen, setIsPaymentStatusDialogOpen] = useState(false);
  const [pendingPaymentStatusUpdate, setPendingPaymentStatusUpdate] = useState<{orderId: string, newStatus: string} | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter(order => order.order_status === 'pending').length,
    processing: orders.filter(order => order.order_status === 'processing').length,
    shipped: orders.filter(order => order.order_status === 'shipped').length,
    delivered: orders.filter(order => order.order_status === 'delivered').length,
    cancelled: orders.filter(order => order.order_status === 'cancelled').length,
    private: orders.filter(order => order.privacy_preference).length,
    public: orders.filter(order => !order.privacy_preference).length,
  };

  // Filter orders based on tab, privacy, search term, and date range
  const getFilteredOrders = (tabFilter: string) => {
    return orders.filter(order => {
      // Exclude pending and pending_payment from 'all' tab
      if (tabFilter === 'all' && (order.order_status === 'pending' || order.order_status === 'pending_payment')) {
        return false;
      }
      
      const matchesStatus = tabFilter === 'all' || order.order_status === tabFilter;
      const matchesPrivacy = privacyFilter === 'all' || 
        (privacyFilter === 'private' && order.privacy_preference) ||
        (privacyFilter === 'public' && !order.privacy_preference);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        order.customer_name.toLowerCase().includes(searchLower) ||
        order.customer_phone.includes(searchTerm) ||
        String(order.order_id).toLowerCase().includes(searchLower) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(searchLower));
      
      // Date filtering
      const orderDate = new Date(order.created_at);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
      const matchesDateRange = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);
      
      return matchesStatus && matchesPrivacy && matchesSearch && matchesDateRange;
    });
  };

  const filteredOrders = getFilteredOrders(activeTab);
  
  // Show popup if no results found with search filters
  useEffect(() => {
    if (searchTerm && filteredOrders.length === 0 && orders.length > 0) {
      const sanitizedSearchTerm = searchTerm.replace(/[<>"'&]/g, '');
      toast.error(`No orders found matching "${sanitizedSearchTerm}". Please recheck your search filters.`);
    }
  }, [searchTerm, filteredOrders.length, orders.length]);
  
  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, privacyFilter, searchTerm, dateFrom, dateTo]);

  // Export functions
  const exportToCSV = (orders: Order[], filename: string) => {
    const headers = [
      'Order ID', 'Email', 'Payment Method', 'Order Status', 'Payment Status', 'Privacy', 'Order Date',
      'Phone', 'Address', 'Customer Name',
      'Total Amount', 'Color', 'Edition', 'Accessories', 'Engraving', 'Steadfast ID'
    ];
    
    const csvData = orders.map(order => [
      order.order_id,
      order.customer_email || '',
      order.payment_method,
      order.order_status,
      order.payment_status,
      order.privacy_preference ? 'Private' : 'Public',
      new Date(order.created_at).toLocaleString(),
      order.customer_phone,
      order.customer_address.replace(/\n/g, ' '),
      order.customer_name,
      order.total_amount,
      order.selected_color === 'obsidian' ? 'OBSIDIAN BLACK' : 'GRAPHITE GREY',
      order.selected_edition,
      order.selected_accessories && order.selected_accessories.length > 0 ? order.selected_accessories.join(', ') : 'None',
      order.engraving_text || 'None',
      order.tracking_number || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    toast.success('CSV exported successfully');
  };

  const exportToExcel = (orders: Order[], filename: string) => {
    const data = orders.map(order => ({
      'Invoice': order.order_id,
      'Name': order.customer_name,
      'Address': order.customer_address.replace(/\n/g, ' '),
      'Phone': order.customer_phone,
      'Amount': order.total_amount,
      'Note': '',
      'Lot': '',
      'Payment Method': order.payment_method,
      'Order Status': order.order_status
    }));
    
    const headers = ['Invoice', 'Name', 'Address', 'Phone', 'Amount', 'Note', 'Lot', 'Payment Method', 'Order Status'];
    const csvContent = [headers, ...data.map(row => headers.map(h => row[h]))]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    toast.success('Excel-compatible CSV exported successfully');
  };

  const exportToPDF = (orders: Order[], filename: string) => {
    const printContent = `
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .private { background-color: #fff3cd; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Ximpul Orders Report - ${filename}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Orders: ${orders.length}</p>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Edition</th>
                <th>Color</th>
                <th>Amount (BDT)</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Privacy</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => `
                <tr class="${order.privacy_preference ? 'private' : ''}">
                  <td>${order.order_id}</td>
                  <td>${order.customer_name}</td>
                  <td>${order.customer_phone}</td>
                  <td>${order.selected_edition}</td>
                  <td>${order.selected_color}</td>
                  <td class="total">${order.total_amount.toLocaleString()}</td>
                  <td>${order.order_status}</td>
                  <td>${order.payment_status}</td>
                  <td>${order.privacy_preference ? 'Private' : 'Public'}</td>
                  <td>${new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      toast.success('PDF export initiated');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setPendingStatusUpdate({ orderId, newStatus });
    setIsStatusDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (adminUser && pendingStatusUpdate) {
      await updateOrderStatus(pendingStatusUpdate.orderId, pendingStatusUpdate.newStatus, adminUser.id, statusUpdateNotes);
      setStatusUpdateNotes('');
      setIsStatusDialogOpen(false);
      setPendingStatusUpdate(null);
    }
  };

  const handlePaymentStatusChange = (orderId: string, newStatus: string) => {
    setPendingPaymentStatusUpdate({ orderId, newStatus });
    setIsPaymentStatusDialogOpen(true);
  };

  const confirmPaymentStatusUpdate = async () => {
    if (adminUser && pendingPaymentStatusUpdate) {
      await updatePaymentStatus(pendingPaymentStatusUpdate.orderId, pendingPaymentStatusUpdate.newStatus, adminUser.id, paymentStatusNotes);
      setPaymentStatusNotes('');
      setIsPaymentStatusDialogOpen(false);
      setPendingPaymentStatusUpdate(null);
    }
  };

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (orderToDelete) {
      await deleteOrder(orderToDelete.id);
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast.success('Order ID copied to clipboard');
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = orderId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Order ID copied to clipboard');
    }
  };

  const OrderStatusBadge = ({ status }: { status: string }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      pending_payment: 'bg-orange-100 text-orange-800 border border-orange-200',
      processing: 'bg-blue-100 text-blue-800 border border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border border-purple-200',
      delivered: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200'
    };
    
    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      pending_payment: <CreditCard className="w-3 h-3 mr-1" />,
      processing: <Package className="w-3 h-3 mr-1" />,
      shipped: <Truck className="w-3 h-3 mr-1" />,
      delivered: <CheckCircle className="w-3 h-3 mr-1" />,
      cancelled: <X className="w-3 h-3 mr-1" />
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {icons[status]}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const PaymentStatusBadge = ({ status }: { status: string }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      failed: 'bg-red-100 text-red-800 border border-red-200',
      refunded: 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    
    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      completed: <CheckCircle className="w-3 h-3 mr-1" />,
      failed: <AlertTriangle className="w-3 h-3 mr-1" />,
      refunded: <ArrowUpRight className="w-3 h-3 mr-1" />
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const PaymentMethodBadge = ({ method }: { method: string }) => {
    if (method.toLowerCase() === 'online') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <Smartphone className="w-3 h-3 mr-1" />
          Online
        </span>
      );
    }
    
    if (method.toLowerCase() === 'cod') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <Banknote className="w-3 h-3 mr-1" />
          COD
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
        <CreditCard className="w-3 h-3 mr-1" />
        {method}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-lg font-medium">Loading orders...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
              <p className="text-gray-600">Manage and track all customer orders efficiently</p>
            </div>
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



        {/* Advanced Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Advanced Filters</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search */}
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Name, phone, email, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Date Range */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            {/* Privacy Filter */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Privacy</label>
              <Select value={privacyFilter} onValueChange={setPrivacyFilter}>
                <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="All" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span>All Orders</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-orange-600" />
                      <span className="text-orange-700 font-medium">Private Only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-green-700 font-medium">Public Only</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(searchTerm || dateFrom || dateTo || privacyFilter !== 'all') && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: {searchTerm}
                  </span>
                )}
                {dateFrom && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    From: {dateFrom}
                  </span>
                )}
                {dateTo && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    To: {dateTo}
                  </span>
                )}
                {privacyFilter !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Privacy: {privacyFilter}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { 
                    setSearchTerm('');
                    setDateFrom(''); 
                    setDateTo(''); 
                    setPrivacyFilter('all');
                  }}
                  className="text-gray-500 hover:text-gray-700 h-6 px-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Filtered Order Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {(searchTerm || dateFrom || dateTo || privacyFilter !== 'all') ? 'Filtered Results' : 'Order Statistics'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{getFilteredOrders('all').length}</p>
                </div>
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Package className="h-5 w-5 text-gray-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Pending</p>
                  <p className="text-2xl font-bold text-yellow-800">{activeTab === 'online' ? orders.filter(o => o.payment_method === 'online' && o.order_status === 'pending').length : activeTab === 'cod' ? orders.filter(o => o.payment_method === 'cod' && o.order_status === 'pending').length : getFilteredOrders('all').filter(o => o.order_status === 'pending').length}</p>
                </div>
                <div className="p-2 bg-yellow-200 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-700">Processing</p>
                  <p className="text-2xl font-bold text-blue-800">{activeTab === 'online' ? orders.filter(o => o.payment_method === 'online' && o.order_status === 'processing').length : activeTab === 'cod' ? orders.filter(o => o.payment_method === 'cod' && o.order_status === 'processing').length : getFilteredOrders('all').filter(o => o.order_status === 'processing').length}</p>
                </div>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Package className="h-5 w-5 text-blue-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-purple-700">Shipped</p>
                  <p className="text-2xl font-bold text-purple-800">{activeTab === 'online' ? orders.filter(o => o.payment_method === 'online' && o.order_status === 'shipped').length : activeTab === 'cod' ? orders.filter(o => o.payment_method === 'cod' && o.order_status === 'shipped').length : getFilteredOrders('all').filter(o => o.order_status === 'shipped').length}</p>
                </div>
                <div className="p-2 bg-purple-200 rounded-lg">
                  <Truck className="h-5 w-5 text-purple-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-green-700">Delivered</p>
                  <p className="text-2xl font-bold text-green-800">{activeTab === 'online' ? orders.filter(o => o.payment_method === 'online' && o.order_status === 'delivered').length : activeTab === 'cod' ? orders.filter(o => o.payment_method === 'cod' && o.order_status === 'delivered').length : getFilteredOrders('all').filter(o => o.order_status === 'delivered').length}</p>
                </div>
                <div className="p-2 bg-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-red-700">Cancelled</p>
                  <p className="text-2xl font-bold text-red-800">{activeTab === 'online' ? orders.filter(o => o.payment_method === 'online' && o.order_status === 'cancelled').length : activeTab === 'cod' ? orders.filter(o => o.payment_method === 'cod' && o.order_status === 'cancelled').length : getFilteredOrders('all').filter(o => o.order_status === 'cancelled').length}</p>
                </div>
                <div className="p-2 bg-red-200 rounded-lg">
                  <X className="h-5 w-5 text-red-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-orange-700">Private</p>
                  <p className="text-2xl font-bold text-orange-800">{getFilteredOrders('all').filter(o => o.privacy_preference).length}</p>
                </div>
                <div className="p-2 bg-orange-200 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-700" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Public</p>
                  <p className="text-2xl font-bold text-emerald-800">{getFilteredOrders('all').filter(o => !o.privacy_preference).length}</p>
                </div>
                <div className="p-2 bg-emerald-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Payment Method Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Categories</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full bg-white border border-gray-200 p-1 rounded-lg">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              All Orders ({orders.filter(o => o.order_status !== 'pending_payment' && o.order_status !== 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="online" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Online Payment ({orders.filter(o => o.payment_method === 'online' && o.order_status !== 'pending_payment' && o.order_status !== 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="cod" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Cash on Delivery ({orders.filter(o => o.payment_method === 'cod' && o.order_status !== 'pending_payment' && o.order_status !== 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Leads ({orders.filter(o => o.order_status === 'pending_payment' || o.order_status === 'pending').length})
            </TabsTrigger>
          </TabsList>
          
          {/* Order Status Tabs */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Status</h3>
            <div className="grid grid-cols-6 gap-2">
              <Button 
                variant={activeStatusTab === 'all_status' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setActiveStatusTab('all_status')}
                className={`text-xs ${activeStatusTab === 'all_status' ? 'bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'}`}
              >
                All Status
              </Button>
              <Button 
                variant={activeStatusTab === 'pending' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setActiveStatusTab('pending')}
                className={`text-xs ${activeStatusTab === 'pending' ? 'bg-yellow-600 text-white' : 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-800'}`}
              >
                Pending ({(() => {
                  if (activeTab === 'online') return orders.filter(o => o.payment_method === 'online' && o.order_status === 'pending').length;
                  if (activeTab === 'cod') return orders.filter(o => o.payment_method === 'cod' && o.order_status === 'pending').length;
                  if (activeTab === 'leads') return orders.filter(o => o.order_status === 'pending').length;
                  return orders.filter(o => o.order_status === 'pending' && o.order_status !== 'pending_payment').length;
                })()})
              </Button>
              <Button 
                variant={activeStatusTab === 'processing' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setActiveStatusTab('processing')}
                className={`text-xs ${activeStatusTab === 'processing' ? 'bg-blue-600 text-white' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'}`}
              >
                Processing ({(() => {
                  if (activeTab === 'online') return orders.filter(o => o.payment_method === 'online' && o.order_status === 'processing').length;
                  if (activeTab === 'cod') return orders.filter(o => o.payment_method === 'cod' && o.order_status === 'processing').length;
                  if (activeTab === 'leads') return orders.filter(o => o.order_status === 'processing' && (o.order_status === 'pending_payment' || o.order_status === 'pending')).length;
                  return orders.filter(o => o.order_status === 'processing' && o.order_status !== 'pending_payment' && o.order_status !== 'pending').length;
                })()})
              </Button>
              <Button 
                variant={activeStatusTab === 'shipped' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setActiveStatusTab('shipped')}
                className={`text-xs ${activeStatusTab === 'shipped' ? 'bg-purple-600 text-white' : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800'}`}
              >
                Shipped ({(() => {
                  if (activeTab === 'online') return orders.filter(o => o.payment_method === 'online' && o.order_status === 'shipped').length;
                  if (activeTab === 'cod') return orders.filter(o => o.payment_method === 'cod' && o.order_status === 'shipped').length;
                  if (activeTab === 'leads') return orders.filter(o => o.order_status === 'shipped' && (o.order_status === 'pending_payment' || o.order_status === 'pending')).length;
                  return orders.filter(o => o.order_status === 'shipped' && o.order_status !== 'pending_payment' && o.order_status !== 'pending').length;
                })()})
              </Button>
              <Button 
                variant={activeStatusTab === 'delivered' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setActiveStatusTab('delivered')}
                className={`text-xs ${activeStatusTab === 'delivered' ? 'bg-green-600 text-white' : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-800'}`}
              >
                Delivered ({(() => {
                  if (activeTab === 'online') return orders.filter(o => o.payment_method === 'online' && o.order_status === 'delivered').length;
                  if (activeTab === 'cod') return orders.filter(o => o.payment_method === 'cod' && o.order_status === 'delivered').length;
                  if (activeTab === 'leads') return orders.filter(o => o.order_status === 'delivered' && (o.order_status === 'pending_payment' || o.order_status === 'pending')).length;
                  return orders.filter(o => o.order_status === 'delivered' && o.order_status !== 'pending_payment' && o.order_status !== 'pending').length;
                })()})
              </Button>
              <Button 
                variant={activeStatusTab === 'cancelled' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setActiveStatusTab('cancelled')}
                className={`text-xs ${activeStatusTab === 'cancelled' ? 'bg-red-600 text-white' : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-800'}`}
              >
                Cancelled ({(() => {
                  if (activeTab === 'online') return orders.filter(o => o.payment_method === 'online' && o.order_status === 'cancelled').length;
                  if (activeTab === 'cod') return orders.filter(o => o.payment_method === 'cod' && o.order_status === 'cancelled').length;
                  if (activeTab === 'leads') return orders.filter(o => o.order_status === 'cancelled' && (o.order_status === 'pending_payment' || o.order_status === 'pending')).length;
                  return orders.filter(o => o.order_status === 'cancelled' && o.order_status !== 'pending_payment' && o.order_status !== 'pending').length;
                })()})
              </Button>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Orders Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {[activeTab].map((tab) => {
          let baseOrders;
          if (tab === 'online') {
            baseOrders = orders.filter(order => order.payment_method === 'online' && order.order_status !== 'pending_payment' && order.order_status !== 'pending');
          } else if (tab === 'cod') {
            baseOrders = orders.filter(order => order.payment_method === 'cod' && order.order_status !== 'pending_payment' && order.order_status !== 'pending');
          } else if (tab === 'leads') {
            baseOrders = orders.filter(order => order.order_status === 'pending_payment' || order.order_status === 'pending');
          } else {
            baseOrders = orders.filter(order => order.order_status !== 'pending_payment' && order.order_status !== 'pending');
          }
          
          // Apply additional filters (search, privacy, date)
          const filteredBaseOrders = baseOrders.filter(order => {
            const matchesPrivacy = privacyFilter === 'all' || 
              (privacyFilter === 'private' && order.privacy_preference) ||
              (privacyFilter === 'public' && !order.privacy_preference);
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || 
              order.customer_name.toLowerCase().includes(searchLower) ||
              order.customer_phone.includes(searchTerm) ||
              String(order.order_id).toLowerCase().includes(searchLower) ||
              (order.customer_email && order.customer_email.toLowerCase().includes(searchLower));
            
            // Date filtering
            const orderDate = new Date(order.created_at);
            const fromDate = dateFrom ? new Date(dateFrom) : null;
            const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
            const matchesDateRange = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);
            
            return matchesPrivacy && matchesSearch && matchesDateRange;
          });
          
          let tabOrders;
          if (activeStatusTab === 'all_status') {
            tabOrders = filteredBaseOrders;
          } else {
            tabOrders = filteredBaseOrders.filter(order => order.order_status === activeStatusTab);
          }
          
          const tabTotalPages = Math.ceil(tabOrders.length / itemsPerPage);
          const tabStartIndex = (currentPage - 1) * itemsPerPage;
          const tabPaginatedOrders = tabOrders.slice(tabStartIndex, tabStartIndex + itemsPerPage);
          
          return (
            <TabsContent key={tab} value={tab} className="space-y-6">
              <Card className={`shadow-sm hover:shadow transition-shadow overflow-hidden ${
                tab === 'online' ? 'bg-blue-50/30 border-blue-200' :
                tab === 'cod' ? 'bg-green-50/30 border-green-200' :
                tab === 'leads' ? 'bg-orange-50/30 border-orange-200' :
                tab === 'pending' ? 'bg-yellow-50/30 border-yellow-200' :
                tab === 'processing' ? 'bg-blue-50/30 border-blue-200' :
                tab === 'shipped' ? 'bg-purple-50/30 border-purple-200' :
                tab === 'delivered' ? 'bg-green-50/30 border-green-200' :
                tab === 'cancelled' ? 'bg-red-50/30 border-red-200' :
                'bg-white border-gray-200'
              }`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="capitalize">
                      {tab === 'all' ? 'All Orders' : 
                       tab === 'online' ? 'Online Payment Orders' :
                       tab === 'cod' ? 'Cash on Delivery Orders' :
                       tab === 'leads' ? 'Leads (Pending Payment)' :
                       tab === 'all_status' ? 'All Status Orders' :
                       tab.replace('_', ' ')} ({tabOrders.length})
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      {tabOrders.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToCSV(tabOrders, `ximpul-orders-${tab}-${new Date().toISOString().split('T')[0]}`)}
                            className="flex items-center gap-1"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToExcel(tabOrders, `ximpul-orders-${tab}-${new Date().toISOString().split('T')[0]}`)}
                            className="flex items-center gap-1"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            Steadfast
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToPDF(tabOrders, `${tab === 'all' ? 'All Orders' : tab.replace('_', ' ').toUpperCase()}`)}
                            className="flex items-center gap-1"
                          >
                            <FilePdf className="h-4 w-4" />
                            PDF
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Show:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="35">35</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {tabOrders.length > itemsPerPage && (
                        <div className="text-sm text-gray-500">
                          Showing {tabStartIndex + 1}-{Math.min(tabStartIndex + itemsPerPage, tabOrders.length)} of {tabOrders.length}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tabPaginatedOrders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                        <p className="text-gray-500 mt-1">Try adjusting your search to find what you're looking for.</p>
                      </div>
                    ) : (
                      tabPaginatedOrders.map((order) => (
                        <div key={order.id} className={`border rounded-lg p-6 transition-all shadow-sm ${
                          order.privacy_preference 
                            ? 'border-orange-200 bg-orange-50/30 hover:bg-orange-50/50 ring-1 ring-orange-100' 
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}>
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-xl text-gray-900">{order.customer_name}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-600">Order ID:</span>
                                  <button 
                                    onClick={() => copyOrderId(order.order_id)}
                                    className="text-primary hover:text-primary/80 font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-flex items-center gap-1 hover:bg-gray-200 transition-colors"
                                  >
                                    {order.order_id}
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-600 min-w-[80px]">Order Status:</span>
                                    <div className="flex items-center gap-2">
                                      <OrderStatusBadge status={order.order_status} />
                                      <Select onValueChange={(value) => handleStatusChange(order.id, value)}>
                                        <SelectTrigger className="w-32 h-8">
                                          <SelectValue placeholder="Update" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="processing">Processing</SelectItem>
                                          <SelectItem value="shipped">Shipped</SelectItem>
                                          <SelectItem value="delivered">Delivered</SelectItem>
                                          <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-600 min-w-[90px]">Payment Status:</span>
                                    <div className="flex items-center gap-2">
                                      <PaymentStatusBadge status={order.payment_status} />
                                      <Select onValueChange={(value) => handlePaymentStatusChange(order.id, value)}>
                                        <SelectTrigger className="w-32 h-8">
                                          <SelectValue placeholder="Update" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="completed">Completed</SelectItem>
                                          <SelectItem value="failed">Failed</SelectItem>
                                          <SelectItem value="refunded">Refunded</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                  <Eye className="w-4 h-4 mr-2" /> View Details
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setInvoiceOrder(order)}>
                                  <FileText className="w-4 h-4 mr-2" /> Invoice
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteOrder(order)}>
                                  <Trash2 className="w-4 h-4" /> Delete
                                </Button>
                              </div>
                            </div>
                              
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                  <Calendar className="h-4 w-4" />
                                  <span>Order Date</span>
                                </div>
                                <p className="text-gray-900 font-medium">
                                  {new Date(order.created_at).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                  <User className="h-4 w-4" />
                                  <span>Customer Info</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="flex items-center gap-2 text-gray-900">
                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                    <span>{order.customer_phone}</span>
                                  </p>
                                  {order.customer_email && (
                                    <p className="flex items-center gap-2 text-gray-900">
                                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                                      <span className="text-sm">{order.customer_email}</span>
                                    </p>
                                  )}
                                  <p className="flex items-start gap-2 text-gray-900">
                                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                    <span className="text-sm whitespace-pre-wrap">{order.customer_address}</span>
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                  <Package className="h-4 w-4" />
                                  <span>Product Details</span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-900"><span className="font-medium">Edition:</span> {order.selected_edition}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">Color:</span>
                                    <ColorBadge color={order.selected_color} />
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-900">Accessories:</span>
                                    <p className="text-gray-700 text-sm">{order.selected_accessories && order.selected_accessories.length > 0 ? order.selected_accessories.join(', ') : 'None'}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-900">Engraving:</span>
                                    <p className="text-gray-700 text-sm">{order.engraving_text || 'No engraving requested'}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                  <CreditCard className="h-4 w-4" />
                                  <span>Payment Info</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">Method:</span>
                                    <PaymentMethodBadge method={order.payment_method} />
                                  </div>
                                  <p className="font-bold text-xl text-primary">{order.total_amount.toLocaleString()} BDT</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    {order.privacy_preference ? (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                                        <Shield className="h-3 w-3 text-orange-700" />
                                        <span className="text-orange-700 text-xs font-semibold">PRIVATE</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                                        <span className="text-green-700 text-xs font-semibold">PUBLIC</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Pagination */}
                  {tabTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Page {currentPage} of {tabTotalPages}
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
                          {Array.from({ length: Math.min(5, tabTotalPages) }, (_, i) => {
                            let pageNum;
                            if (tabTotalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= tabTotalPages - 2) {
                              pageNum = tabTotalPages - 4 + i;
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
                          onClick={() => setCurrentPage(Math.min(tabTotalPages, currentPage + 1))}
                          disabled={currentPage === tabTotalPages}
                          className="flex items-center gap-1"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order ID: {selectedOrder?.order_id}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="customer">Customer Info</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order ID:</span>
                        <span className="font-mono text-xs">{selectedOrder.order_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <OrderStatusBadge status={selectedOrder.order_status} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Status:</span>
                        <PaymentStatusBadge status={selectedOrder.payment_status} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Method:</span>
                        <PaymentMethodBadge method={selectedOrder.payment_method} />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Privacy:</span>
                        <div className="flex items-center gap-1">
                          {selectedOrder.privacy_preference ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                              <Shield className="h-3 w-3 text-orange-700" />
                              <span className="text-orange-700 text-xs font-semibold">PRIVATE</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                              <span className="text-green-700 text-xs font-semibold">PUBLIC</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Edition:</span>
                        <span>{selectedOrder.selected_edition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Color:</span>
                        <ColorBadge color={selectedOrder.selected_color} />
                      </div>
                      {selectedOrder.selected_accessories && selectedOrder.selected_accessories.length > 0 && (
                        <div>
                          <span className="text-gray-500">Accessories:</span>
                          <ul className="list-disc list-inside mt-1 pl-2">
                            {selectedOrder.selected_accessories.map((acc, idx) => (
                              <li key={idx}>{acc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Engraving:</span>
                        {selectedOrder.engraving_text ? (
                          <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">ENGRAVED</span>
                            </div>
                            <p className="font-bold text-gray-900 text-lg">"{selectedOrder.engraving_text}"</p>
                          </div>
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-gray-500 italic">No engraving requested</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{selectedOrder.subtotal.toLocaleString()} BDT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery Fee:</span>
                        <span>{selectedOrder.delivery_fee.toLocaleString()} BDT</span>
                      </div>
                      <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                        <span>Total:</span>
                        <span>{selectedOrder.total_amount.toLocaleString()} BDT</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="customer">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{selectedOrder.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{selectedOrder.customer_phone}</span>
                        </div>
                        {selectedOrder.customer_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{selectedOrder.customer_email}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="whitespace-pre-wrap">{selectedOrder.customer_address}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="actions">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Update Order Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="mb-2 block">Current Status:</Label>
                          <OrderStatusBadge status={selectedOrder.order_status} />
                        </div>
                        <div>
                          <Label className="mb-2 block">Change Status To:</Label>
                          <Select onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Update Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="mb-2 block">Current Status:</Label>
                          <PaymentStatusBadge status={selectedOrder.payment_status} />
                        </div>
                        <div>
                          <Label className="mb-2 block">Change Status To:</Label>
                          <Select onValueChange={(value) => handlePaymentStatusChange(selectedOrder.id, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog 
        open={isStatusDialogOpen} 
        onOpenChange={(open) => {
          setIsStatusDialogOpen(open);
          if (!open) {
            document.body.style.pointerEvents = '';
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>Change the status of this order and add optional notes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Label>New Status:</Label>
              {pendingStatusUpdate && <OrderStatusBadge status={pendingStatusUpdate.newStatus} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status change..."
                value={statusUpdateNotes}
                onChange={(e) => setStatusUpdateNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmStatusUpdate}>Confirm Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Status Update Dialog */}
      <Dialog 
        open={isPaymentStatusDialogOpen} 
        onOpenChange={(open) => {
          setIsPaymentStatusDialogOpen(open);
          if (!open) {
            document.body.style.pointerEvents = '';
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
            <DialogDescription>Change the payment status of this order and add optional notes</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Label>New Payment Status:</Label>
              {pendingPaymentStatusUpdate && <PaymentStatusBadge status={pendingPaymentStatusUpdate.newStatus} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentNotes">Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                placeholder="Add any notes about this payment status change..."
                value={paymentStatusNotes}
                onChange={(e) => setPaymentStatusNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmPaymentStatusUpdate}>Confirm Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setOrderToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {orderToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Order Details</span>
                </div>
                <div className="space-y-1 text-sm text-red-700">
                  <p><strong>Order ID:</strong> {orderToDelete.order_id}</p>
                  <p><strong>Customer:</strong> {orderToDelete.customer_name}</p>
                  <p><strong>Amount:</strong> {orderToDelete.total_amount.toLocaleString()} BDT</p>
                  <p><strong>Status:</strong> {orderToDelete.order_status}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteOrder}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog open={!!invoiceOrder} onOpenChange={(open) => !open && setInvoiceOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice - {invoiceOrder?.order_id}
            </DialogTitle>
            <DialogDescription>Professional invoice for order</DialogDescription>
          </DialogHeader>
          {invoiceOrder && (
            <div className="space-y-6 invoice-content">
              {/* Invoice Header */}
              <div className="flex justify-between items-center border-b-2 border-black pb-4">
                <div className="text-3xl font-bold">XIMPUL</div>
                <div className="text-2xl text-gray-600">INVOICE</div>
              </div>
              
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-3 border-b border-gray-200 pb-1">Bill To:</h3>
                  <div className="space-y-1">
                    <p className="font-semibold">{invoiceOrder.customer_name}</p>
                    <p>{invoiceOrder.customer_phone}</p>
                    {invoiceOrder.customer_email && <p>{invoiceOrder.customer_email}</p>}
                    <p className="whitespace-pre-wrap">{invoiceOrder.customer_address}</p>
                    {invoiceOrder.privacy_preference && (
                      <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold mt-2">
                        PRIVATE ORDER
                      </span>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3 border-b border-gray-200 pb-1">Invoice Details:</h3>
                  <div className="space-y-1">
                    <p><span className="font-medium">Invoice #:</span> {invoiceOrder.order_id}</p>
                    <p><span className="font-medium">Order Date:</span> {new Date(invoiceOrder.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'long', day: 'numeric' 
                    })}</p>
                    <p><span className="font-medium">Order Status:</span> <OrderStatusBadge status={invoiceOrder.order_status} /></p>
                    <p><span className="font-medium">Payment Status:</span> <PaymentStatusBadge status={invoiceOrder.payment_status} /></p>
                    <p className="flex items-center gap-2"><span className="font-medium">Payment Method:</span> <PaymentMethodBadge method={invoiceOrder.payment_method} /></p>
                  </div>
                </div>
              </div>
              
              {/* Order Details Table */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Order Details</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left">Product</th>
                      <th className="border border-gray-300 p-3 text-left">Edition</th>
                      <th className="border border-gray-300 p-3 text-left">Color</th>
                      <th className="border border-gray-300 p-3 text-left">Engraving</th>
                      <th className="border border-gray-300 p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">Ximpul Flow Water Bottle</td>
                      <td className="border border-gray-300 p-3">{invoiceOrder.selected_edition}</td>
                      <td className="border border-gray-300 p-3">
                        <ColorBadge color={invoiceOrder.selected_color} />
                      </td>
                      <td className="border border-gray-300 p-3">{invoiceOrder.engraving_text || 'None'}</td>
                      <td className="border border-gray-300 p-3 text-right font-medium">{invoiceOrder.subtotal.toLocaleString()} BDT</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Total Section */}
              <div className="flex justify-end">
                <div className="w-80">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2">
                      <span>Subtotal:</span>
                      <span>{invoiceOrder.subtotal.toLocaleString()} BDT</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Delivery Fee:</span>
                      <span>{invoiceOrder.delivery_fee.toLocaleString()} BDT</span>
                    </div>
                    <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-black">
                      <span>Total Amount:</span>
                      <span>{invoiceOrder.total_amount.toLocaleString()} BDT</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="text-center border-t border-gray-200 pt-4 text-sm text-gray-600">
                <p className="font-semibold">Ximpul - Making Water Free Again</p>
                <p>Thank you for choosing Ximpul Flow!</p>
                <p>For support, contact us at ximpulshop@gmail.com</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t no-print">
                <Button variant="outline" onClick={() => setInvoiceOrder(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  const printContent = document.querySelector('.invoice-content')?.innerHTML;
                  const printWindow = window.open('', '_blank');
                  if (printWindow && printContent) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Invoice - ${invoiceOrder.order_id}</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                            .invoice-content { max-width: 800px; margin: 0 auto; }
                            table { width: 100%; border-collapse: collapse; }
                            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                            th { background-color: #f0f0f0; }
                            .text-center { text-align: center; }
                            .font-bold { font-weight: bold; }
                            .border-b-2 { border-bottom: 2px solid #000; }
                            .pb-4 { padding-bottom: 16px; }
                            .mb-3 { margin-bottom: 12px; }
                            .space-y-1 > * + * { margin-top: 4px; }
                            .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                            .w-80 { width: 300px; margin-left: auto; }
                            @page { size: A4; margin: 1cm; }
                          </style>
                        </head>
                        <body>
                          <div class="invoice-content">${printContent}</div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 250);
                  }
                }} className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Invoice
                </Button>
              </div>
              
              {/* Print Styles */}
              <style jsx>{`
                @media print {
                  body { margin: 0; padding: 0; }
                  .no-print { display: none !important; }
                  .max-w-4xl { max-width: 100% !important; width: 100% !important; }
                  .overflow-y-auto { overflow: visible !important; }
                  .max-h-\[90vh\] { max-height: none !important; height: auto !important; }
                  .p-6 { padding: 1rem !important; }
                  .space-y-6 > * + * { margin-top: 1rem !important; }
                  .grid { display: grid !important; }
                  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                  .gap-8 { gap: 1rem !important; }
                  .border { border: 1px solid #000 !important; }
                  .border-gray-300 { border-color: #000 !important; }
                  .text-3xl { font-size: 1.5rem !important; }
                  .text-2xl { font-size: 1.25rem !important; }
                  .text-lg { font-size: 1rem !important; }
                  .font-bold { font-weight: 700 !important; }
                  .bg-gray-50 { background-color: #f9fafb !important; }
                  .rounded-xl { border-radius: 0 !important; }
                  .shadow-sm { box-shadow: none !important; }
                  .w-80 { width: 100% !important; }
                  .justify-end { justify-content: flex-end !important; }
                  @page { size: A4; margin: 1cm; }
                }
              `}</style>
            </div>
          )}
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
};