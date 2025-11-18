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
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { 
  Eye, Copy, RefreshCw, Search, Filter, Calendar, 
  Package, Truck, CheckCircle, AlertTriangle, Clock, 
  CreditCard, MapPin, FileText, User, Phone, Mail, 
  X, ArrowUpRight, Trash2, Shield, ChevronLeft, ChevronRight,
  Download, FileSpreadsheet, FileText as FilePdf, Printer, Receipt,
  Banknote, Smartphone, Send
} from 'lucide-react';
import { toast } from 'sonner';
import JsBarcode from 'jsbarcode';

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
  const [steadfastOrder, setSteadfastOrder] = useState<Order | null>(null);
  const [steadfastParcelId, setSteadfastParcelId] = useState<string>('');
  const [isSendingToSteadfast, setIsSendingToSteadfast] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualOrderData, setManualOrderData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    selected_accessories: [] as string[],
    accessory_quantities: {} as Record<string, number>,
    engraving_text: '',
    payment_method: 'cod',
    base_black: 0,
    base_grey: 0,
    lifestyle_black: 0,
    lifestyle_grey: 0,
    subtotal: 0,
    delivery_fee: 100,
    total_amount: 100,
    privacy_preference: false
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [showDeletedOrders, setShowDeletedOrders] = useState(false);
  const [deletedOrders, setDeletedOrders] = useState([]);

  // Function to backup order before deletion
  const backupOrderBeforeDelete = async (order: Order, reason: string = '') => {
    try {
      await supabaseAdmin.from('deleted_orders').insert({
        original_order_id: order.order_id,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        customer_address: order.customer_address,
        selected_edition: order.selected_edition,
        selected_color: order.selected_color,
        selected_accessories: order.selected_accessories,
        engraving_text: order.engraving_text,
        payment_method: order.payment_method,
        quantity: order.quantity,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total_amount: order.total_amount,
        order_status: order.order_status,
        payment_status: order.payment_status,
        privacy_preference: order.privacy_preference,
        steadfast_parcel_id: order.steadfast_parcel_id,
        tracking_number: order.tracking_number,
        original_created_at: order.created_at,
        deleted_by: adminUser.id,
        deleted_by_name: adminUser.name,
        deleted_by_email: adminUser.email,
        deletion_reason: reason
      });
    } catch (error) {
      console.error('Error backing up order:', error);
      throw error;
    }
  };

  // Function to fetch deleted orders
  const fetchDeletedOrders = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('deleted_orders')
        .select('*')
        .order('deleted_at', { ascending: false });
      
      if (error) throw error;
      setDeletedOrders(data || []);
    } catch (error) {
      console.error('Error fetching deleted orders:', error);
      toast.error('Failed to fetch deleted orders');
    }
  };

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
      // Exclude orders with pending payment from 'all' tab, but include pending orders with completed payment
      if (tabFilter === 'all' && (order.order_status === 'pending_payment' || (order.order_status === 'pending' && order.payment_status === 'pending'))) {
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
  
  // Show popup if no results found with search filters (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && filteredOrders.length === 0 && orders.length > 0) {
        const sanitizedSearchTerm = searchTerm.replace(/[<>"'&]/g, '');
        toast.error(`No orders found matching "${sanitizedSearchTerm}". Please recheck your search filters.`);
      }
    }, 500);
    return () => clearTimeout(timer);
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
      const order = orders.find(o => o.id === pendingStatusUpdate.orderId);
      
      await updateOrderStatus(pendingStatusUpdate.orderId, pendingStatusUpdate.newStatus, adminUser.id, statusUpdateNotes);
      
      // Show success message with admin info
      toast.success(`Order status updated to ${pendingStatusUpdate.newStatus} by ${adminUser.name || adminUser.username}`);
      
      // Auto create Steadfast parcel when status changes from pending to processing
      if (order && pendingStatusUpdate.newStatus === 'processing' && order.order_status === 'pending' && !order.tracking_number) {
        toast.info('Creating Steadfast parcel automatically...');
        await handleSendToSteadfast(order);
      }
      
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
      
      // Show success message with admin info
      toast.success(`Payment status updated to ${pendingPaymentStatusUpdate.newStatus} by ${adminUser.name || adminUser.username}`);
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
    if (!orderToDelete || !adminUser) return;
    
    try {
      // First backup the order
      await backupOrderBeforeDelete(orderToDelete, deletionReason);
      
      // Then delete the order
      await deleteOrder(orderToDelete.id);
      
      toast.success('Order deleted and backed up successfully');
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      setDeletionReason('');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const handleSendToSteadfast = async (order: Order) => {
    setIsSendingToSteadfast(true);
    try {
      // Fetch SteadFast credentials from database
      const { data: vendors, error } = await supabaseAdmin
        .from('courier_vendors')
        .select('*')
        .eq('type', 'steadfast')
        .eq('status', 'active')
        .limit(1);

      if (error || !vendors || vendors.length === 0) {
        throw new Error('No active SteadFast vendor found. Please configure SteadFast in Courier Management.');
      }

      const steadfastVendor = vendors[0];
      if (!steadfastVendor.api_key || !steadfastVendor.secret_key) {
        throw new Error('SteadFast API credentials not configured. Please update in Courier Management.');
      }

      const codAmount = order.payment_method === 'online' ? 0 : order.total_amount;
      
      const steadfastData = {
        invoice: order.order_id,
        recipient_name: order.customer_name,
        recipient_phone: order.customer_phone,
        recipient_address: order.customer_address,
        cod_amount: codAmount,
        note: `Ximpul Flow - ${order.selected_edition} - ${order.selected_color === 'obsidian' ? 'Obsidian Black' : 'Graphite Grey'}${order.engraving_text ? ` - Engraved: "${order.engraving_text}"` : ''}`
      };

      const apiUrl = steadfastVendor.base_url.endsWith('/') 
        ? `${steadfastVendor.base_url}create_order` 
        : `${steadfastVendor.base_url}/create_order`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Api-Key': steadfastVendor.api_key,
          'Secret-Key': steadfastVendor.secret_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(steadfastData)
      });

      const result = await response.json();
      
      if (result.status === 200 && result.consignment) {
        const parcelId = result.consignment.consignment_id;
        setSteadfastParcelId(parcelId);
        setSteadfastOrder(order);
        
        // Update tracking number in database
        await updateTrackingInfo(order.id, parcelId, '');
        
        toast.success('Order sent to Steadfast successfully!');
      } else {
        throw new Error(result.message || 'Failed to send to Steadfast');
      }
    } catch (error) {
      console.error('Error sending to Steadfast:', error);
      toast.error(`Failed to send order to Steadfast: ${error.message}`);
    } finally {
      setIsSendingToSteadfast(false);
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

  const generateBarcode = (text: string): string => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating barcode:', error);
      return '';
    }
  };

  const handleCreateManualOrder = async () => {
    if (!manualOrderData.customer_name || !manualOrderData.customer_phone || !manualOrderData.customer_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    const totalQty = manualOrderData.base_black + manualOrderData.base_grey + manualOrderData.lifestyle_black + manualOrderData.lifestyle_grey;
    if (totalQty === 0) {
      toast.error('Please select at least one edition with quantity');
      return;
    }

    setIsCreatingOrder(true);
    try {
      // Get max order_id to avoid duplicate key constraint
      const { data: maxOrder } = await supabaseAdmin
        .from('orders')
        .select('order_id')
        .order('order_id', { ascending: false })
        .limit(1)
        .single();

      const nextOrderId = maxOrder ? maxOrder.order_id + 1 : 1;

      // Build edition string with quantities and colors
      const editions = [];
      if (manualOrderData.base_black > 0) {
        editions.push(`Base Edition (Black) × ${manualOrderData.base_black}`);
      }
      if (manualOrderData.base_grey > 0) {
        editions.push(`Base Edition (Grey) × ${manualOrderData.base_grey}`);
      }
      if (manualOrderData.lifestyle_black > 0) {
        editions.push(`Lifestyle Edition (Black) × ${manualOrderData.lifestyle_black}`);
      }
      if (manualOrderData.lifestyle_grey > 0) {
        editions.push(`Lifestyle Edition (Grey) × ${manualOrderData.lifestyle_grey}`);
      }
      const editionString = editions.join(', ');
      const colorString = (manualOrderData.base_black + manualOrderData.lifestyle_black) > 0 && (manualOrderData.base_grey + manualOrderData.lifestyle_grey) > 0 ? 'mixed' : (manualOrderData.base_black + manualOrderData.lifestyle_black) > 0 ? 'obsidian' : 'graphite';

      // Encode quantities in accessory names
      const accessoriesWithQty = manualOrderData.selected_accessories.map(acc => {
        const qty = manualOrderData.accessory_quantities[acc] || 1;
        return qty > 1 ? `${acc} × ${qty}` : acc;
      });

      const timestamp = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from('orders')
        .insert({
          order_id: nextOrderId,
          customer_name: manualOrderData.customer_name,
          customer_phone: manualOrderData.customer_phone,
          customer_email: manualOrderData.customer_email || null,
          customer_address: manualOrderData.customer_address,
          selected_edition: editionString,
          selected_color: colorString,
          selected_accessories: accessoriesWithQty,
          engraving_text: manualOrderData.engraving_text || null,
          payment_method: manualOrderData.payment_method,
          subtotal: manualOrderData.subtotal,
          delivery_fee: manualOrderData.delivery_fee,
          total_amount: manualOrderData.total_amount,
          privacy_preference: manualOrderData.privacy_preference,
          order_status: 'pending',
          payment_status: manualOrderData.payment_method === 'online' ? 'completed' : 'pending',
          processed_by: adminUser.id,
          processed_at: timestamp,
          created_at: timestamp
        })
        .select()
        .single();

      if (error) {
        console.error('Order creation error:', error);
        toast.error(`Failed to create order: ${error.message}`);
        return;
      }

      toast.success('Manual order created successfully!');
      await fetchOrders();
      setIsManualEntryOpen(false);
      setManualOrderData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_address: '',
        selected_accessories: [],
        accessory_quantities: {},
        engraving_text: '',
        payment_method: 'cod',
        base_black: 0,
        base_grey: 0,
        lifestyle_black: 0,
        lifestyle_grey: 0,
        subtotal: 0,
        delivery_fee: 100,
        total_amount: 100,
        privacy_preference: false
      });
    } catch (error: any) {
      console.error('Error creating manual order:', error);
      toast.error(`Failed to create order: ${error.message || 'Please try again'}`);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const updateManualOrderPricing = () => {
    setManualOrderData(prev => {
      const baseTotal = 1190 * (prev.base_black + prev.base_grey);
      const lifestyleTotal = 1650 * (prev.lifestyle_black + prev.lifestyle_grey);
      
      const accessoryPrices = {
        'Straw Cap': 350,
        'Cleaning Brush': 90,
        'Straw Cleaning Brush': 50,
        'Aluminimum Hook': 90
      };
      
      const accessoriesTotal = prev.selected_accessories.reduce((sum, acc) => {
        const qty = prev.accessory_quantities[acc] || 1;
        return sum + (accessoryPrices[acc] || 0) * qty;
      }, 0);
      const subtotal = baseTotal + lifestyleTotal + accessoriesTotal;
      const deliveryFee = prev.payment_method === 'cod' ? 100 : 0;
      const total = subtotal + deliveryFee;
      
      return { ...prev, subtotal, delivery_fee: deliveryFee, total_amount: total };
    });
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
      pending: 'bg-red-600 text-white',
      completed: 'bg-green-600 text-white',
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
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
          <Smartphone className="w-3 h-3 mr-1" />
          Online
        </span>
      );
    }
    
    if (method.toLowerCase() === 'cod') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
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
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setShowDeletedOrders(true);
                  fetchDeletedOrders();
                }} 
                variant="outline"
                className="flex items-center gap-2 h-10 px-4 border-red-300 text-red-700 hover:bg-black hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
                View Deleted Orders
              </Button>
              <Button 
                onClick={() => setIsManualEntryOpen(true)} 
                className="flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Package className="h-4 w-4" />
                Manual Entry
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



        {/* Order Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {(searchTerm || dateFrom || dateTo || privacyFilter !== 'all') ? 'Filtered Results' : 'Order Statistics'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-gray-200 rounded-lg mb-3">
                  <Package className="h-5 w-5 text-gray-700" />
                </div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{getFilteredOrders('all').length}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-yellow-200 rounded-lg mb-3">
                  <Clock className="h-5 w-5 text-yellow-700" />
                </div>
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-800">{activeTab === 'online' ? orders.filter(o => o.payment_method === 'online' && o.order_status === 'pending').length : activeTab === 'cod' ? orders.filter(o => o.payment_method === 'cod' && o.order_status === 'pending').length : getFilteredOrders('all').filter(o => o.order_status === 'pending').length}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-blue-200 rounded-lg mb-3">
                  <Package className="h-5 w-5 text-blue-700" />
                </div>
                <p className="text-sm font-medium text-blue-700">Processing</p>
                <p className="text-2xl font-bold text-blue-800">{activeTab === 'online' ? orders.filter(o => o.payment_method === 'online' && o.order_status === 'processing').length : activeTab === 'cod' ? orders.filter(o => o.payment_method === 'cod' && o.order_status === 'processing').length : getFilteredOrders('all').filter(o => o.order_status === 'processing').length}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-purple-200 rounded-lg mb-3">
                  <Truck className="h-5 w-5 text-purple-700" />
                </div>
                <p className="text-sm font-medium text-purple-700">Shipped</p>
                <p className="text-2xl font-bold text-purple-800">{activeTab === 'online' ? orders.filter(o => o.payment_method === 'online' && o.order_status === 'shipped').length : activeTab === 'cod' ? orders.filter(o => o.payment_method === 'cod' && o.order_status === 'shipped').length : getFilteredOrders('all').filter(o => o.order_status === 'shipped').length}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-green-200 rounded-lg mb-3">
                  <CheckCircle className="h-5 w-5 text-green-700" />
                </div>
                <p className="text-sm font-medium text-green-700">Delivered</p>
                <p className="text-2xl font-bold text-green-800">{activeTab === 'online' ? orders.filter(o => o.payment_method === 'online' && o.order_status === 'delivered').length : activeTab === 'cod' ? orders.filter(o => o.payment_method === 'cod' && o.order_status === 'delivered').length : getFilteredOrders('all').filter(o => o.order_status === 'delivered').length}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-red-200 rounded-lg mb-3">
                  <X className="h-5 w-5 text-red-700" />
                </div>
                <p className="text-sm font-medium text-red-700">Cancelled</p>
                <p className="text-2xl font-bold text-red-800">{activeTab === 'online' ? orders.filter(o => o.payment_method === 'online' && o.order_status === 'cancelled').length : activeTab === 'cod' ? orders.filter(o => o.payment_method === 'cod' && o.order_status === 'cancelled').length : getFilteredOrders('all').filter(o => o.order_status === 'cancelled').length}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-orange-200 rounded-lg mb-3">
                  <Shield className="h-5 w-5 text-orange-700" />
                </div>
                <p className="text-sm font-medium text-orange-700">Private</p>
                <p className="text-2xl font-bold text-orange-800">{getFilteredOrders('all').filter(o => o.privacy_preference).length}</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
              <div className="flex flex-col items-center text-center">
                <div className="p-2 bg-emerald-200 rounded-lg mb-3">
                  <CheckCircle className="h-5 w-5 text-emerald-700" />
                </div>
                <p className="text-sm font-medium text-emerald-700">Public</p>
                <p className="text-2xl font-bold text-emerald-800">{getFilteredOrders('all').filter(o => !o.privacy_preference).length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

      {/* Order Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Categories</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full bg-white border border-gray-200 p-1 rounded-lg">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              All Orders ({orders.filter(o => !(o.order_status === 'pending_payment' || (o.order_status === 'pending' && o.payment_status === 'pending'))).length})
            </TabsTrigger>
            <TabsTrigger value="online" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Online Payment ({orders.filter(o => o.payment_method === 'online' && !(o.order_status === 'pending_payment' || (o.order_status === 'pending' && o.payment_status === 'pending'))).length})
            </TabsTrigger>
            <TabsTrigger value="cod" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Cash on Delivery ({orders.filter(o => o.payment_method === 'cod' && !(o.order_status === 'pending_payment' || (o.order_status === 'pending' && o.payment_status === 'pending'))).length})
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Leads ({orders.filter(o => o.order_status === 'pending_payment' || (o.order_status === 'pending' && o.payment_status === 'pending')).length})
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
            baseOrders = orders.filter(order => order.payment_method === 'online' && !(order.order_status === 'pending_payment' || (order.order_status === 'pending' && order.payment_status === 'pending')));
          } else if (tab === 'cod') {
            baseOrders = orders.filter(order => order.payment_method === 'cod' && !(order.order_status === 'pending_payment' || (order.order_status === 'pending' && order.payment_status === 'pending')));
          } else if (tab === 'leads') {
            baseOrders = orders.filter(order => order.order_status === 'pending_payment' || (order.order_status === 'pending' && order.payment_status === 'pending'));
          } else {
            baseOrders = orders.filter(order => !(order.order_status === 'pending_payment' || (order.order_status === 'pending' && order.payment_status === 'pending')));
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
                        <div key={order.id} className={`border rounded-lg p-4 transition-all shadow-sm ${
                          order.privacy_preference 
                            ? 'border-orange-200 bg-orange-50/30 hover:bg-orange-50/50 ring-1 ring-orange-100' 
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}>
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="font-semibold text-xl text-gray-900">{order.customer_name}</h3>
                                  <span className="text-gray-600 text-sm">
                                    Order ID: 
                                    <button 
                                      onClick={() => copyOrderId(order.order_id)}
                                      className="text-primary hover:text-primary/80 font-mono font-medium ml-1 hover:underline"
                                    >
                                      {order.order_id}
                                    </button>
                                  </span>
                                  {order.is_manual_order ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
                                      <Package className="w-3 h-3 mr-1" />
                                      MANUAL ORDER
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-600 text-white">
                                      <Smartphone className="w-3 h-3 mr-1" />
                                      WEBSITE ORDER
                                    </span>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-600 min-w-[80px]">Order Status:</span>
                                    <div className="flex items-center gap-2">
                                      <OrderStatusBadge status={order.order_status} />
                                      <Select onValueChange={(value) => handleStatusChange(order.id, value)}>
                                        <SelectTrigger className="w-28 h-8">
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
                                        <SelectTrigger className="w-28 h-8">
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
                              
                              <div className="flex flex-col gap-3 justify-end mt-6">
                                <div className="flex gap-2 items-end">
                                  {order.order_status === 'processing' && order.tracking_number && (
                                    <div 
                                      className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity border border-green-300 rounded-lg p-2 bg-green-50"
                                      onClick={() => {
                                        setSteadfastParcelId(order.tracking_number);
                                        setSteadfastOrder(order);
                                      }}
                                    >
                                      <div className="w-6 h-6 flex items-center justify-center">
                                        <img src="/ximpul-uploads/steadfast.svg" alt="Steadfast" className="w-6 h-6" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-green-700 font-medium text-xs">Steadfast</span>
                                        <span className="text-green-700 font-medium text-xs">{order.tracking_number}</span>
                                      </div>
                                    </div>
                                  )}
                                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteOrder(order)}>
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </Button>
                                </div>
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
                                {/* Admin Creation/Update Info */}
                                {order.processed_by && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    {order.is_manual_order && (order.order_status === 'pending' || order.order_status === 'pending_payment') ? (
                                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                                        <div className="flex items-center gap-2 text-xs text-purple-700">
                                          <Package className="h-3 w-3" />
                                          <span>Manually created by: <span className="font-semibold text-purple-900">{order.updated_by_name}</span></span>
                                        </div>
                                        <div className="text-xs text-purple-600 mt-1 ml-5">
                                          {new Date(order.created_at).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>
                                    ) : order.updated_by_name ? (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                        <div className="flex items-center gap-2 text-xs text-blue-700">
                                          <User className="h-3 w-3" />
                                          <span>Last updated by: <span className="font-semibold text-blue-900">{order.updated_by_name}</span></span>
                                        </div>
                                        <div className="text-xs text-blue-600 mt-1 ml-5">
                                          {new Date(order.updated_at).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                )}
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
                                  <p className="text-gray-900"><span className="font-medium">Accessories:</span> <span className="text-gray-600">{order.selected_accessories && order.selected_accessories.length > 0 ? order.selected_accessories.join(', ') : 'None'}</span></p>
                                  <p className="text-gray-900"><span className="font-medium">Engraving:</span> <span className="text-gray-600">{order.engraving_text || 'No engraving'}</span></p>
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
            <Tabs defaultValue="details" onValueChange={(value) => {
              if (value === 'invoice') {
                setInvoiceOrder(selectedOrder);
                setSelectedOrder(null);
              }
            }}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="customer">Customer Info</TabsTrigger>
                <TabsTrigger value="invoice">Invoice</TabsTrigger>
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
                      {!selectedOrder.selected_edition.includes('(') && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Color:</span>
                          <ColorBadge color={selectedOrder.selected_color} />
                        </div>
                      )}
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
            {adminUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <User className="h-4 w-4" />
                  <span>This update will be recorded as made by: <span className="font-medium">{adminUser.name || adminUser.username}</span></span>
                </div>
              </div>
            )}
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
            {adminUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <User className="h-4 w-4" />
                  <span>This update will be recorded as made by: <span className="font-medium">{adminUser.name || adminUser.username}</span></span>
                </div>
              </div>
            )}
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
            setDeletionReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              This order will be backed up before deletion. Please provide a reason for deletion.
            </DialogDescription>
          </DialogHeader>
          {orderToDelete && (
            <div className="py-4 space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="deletionReason">Reason for Deletion</Label>
                <Textarea
                  id="deletionReason"
                  placeholder="Please explain why this order is being deleted..."
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Shield className="h-4 w-4" />
                  <span>Order data will be backed up to deleted_orders table before deletion</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteOrder}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete & Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deleted Orders Dialog */}
      <Dialog open={showDeletedOrders} onOpenChange={setShowDeletedOrders}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Deleted Orders ({deletedOrders.length})
            </DialogTitle>
            <DialogDescription>
              View all orders that have been deleted and backed up
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deletedOrders.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No deleted orders</h3>
                <p className="text-gray-500">No orders have been deleted yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Deleted By</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Deletion Reason</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Deleted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-xs">{order.original_order_id}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-gray-500 text-xs">{order.customer_phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{order.total_amount?.toLocaleString()} BDT</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {order.order_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-xs">{order.deleted_by_name}</p>
                            <p className="text-gray-500 text-xs">{order.deleted_by_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={order.deletion_reason}>
                          {order.deletion_reason || 'No reason provided'}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-xs">
                          {new Date(order.deleted_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeletedOrders(false)}>
              Close
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
                    <p><span className="font-medium">Payment Status:</span> <PaymentStatusBadge status={invoiceOrder.payment_method === 'online' ? 'completed' : invoiceOrder.payment_status} /></p>
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
                      {!invoiceOrder.selected_edition.includes('(') && <th className="border border-gray-300 p-3 text-left">Color</th>}
                      <th className="border border-gray-300 p-3 text-left">Engraving</th>
                      <th className="border border-gray-300 p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">Ximpul Flow Water Bottle</td>
                      <td className="border border-gray-300 p-3">{invoiceOrder.selected_edition}</td>
                      {!invoiceOrder.selected_edition.includes('(') && (
                        <td className="border border-gray-300 p-3">
                          <ColorBadge color={invoiceOrder.selected_color} />
                        </td>
                      )}
                      <td className="border border-gray-300 p-3">{invoiceOrder.engraving_text || 'None'}</td>
                      <td className="border border-gray-300 p-3 text-right font-medium">{invoiceOrder.subtotal.toLocaleString()} BDT</td>
                    </tr>
                    {invoiceOrder.selected_accessories && invoiceOrder.selected_accessories.length > 0 && (() => {
                      const hasLifestyle = invoiceOrder.selected_edition.toLowerCase().includes('lifestyle');
                      const hasBase = invoiceOrder.selected_edition.toLowerCase().includes('base');
                      const prices = { 'Straw Cap': 350, 'Cleaning Brush': 90, 'Straw Cleaning Brush': 50, 'Aluminimum Hook': 90 };
                      
                      // Parse accessory name and quantity
                      const parseAccessory = (accStr) => {
                        const match = accStr.match(/^(.+?)\s*×\s*(\d+)$/);
                        if (match) {
                          return { name: match[1], qty: parseInt(match[2]) };
                        }
                        return { name: accStr, qty: 1 };
                      };
                      
                      // Only show accessories for Base Edition
                      if (hasBase && !hasLifestyle) {
                        return invoiceOrder.selected_accessories.map((accStr, idx) => {
                          const { name, qty } = parseAccessory(accStr);
                          return (
                            <tr key={idx}>
                              <td className="border border-gray-300 p-3">{name}</td>
                              <td className="border border-gray-300 p-3" colSpan={invoiceOrder.selected_edition.includes('(') ? 1 : 2}>Qty: {qty}</td>
                              <td className="border border-gray-300 p-3">{prices[name]} BDT each</td>
                              <td className="border border-gray-300 p-3 text-right font-medium">{(prices[name] * qty).toLocaleString()} BDT</td>
                            </tr>
                          );
                        });
                      } else if (hasLifestyle && hasBase) {
                        // Show only Base Edition accessories (charged)
                        return invoiceOrder.selected_accessories.map((accStr, idx) => {
                          const { name, qty } = parseAccessory(accStr);
                          return (
                            <tr key={idx}>
                              <td className="border border-gray-300 p-3">{name} (for Base Edition)</td>
                              <td className="border border-gray-300 p-3" colSpan={invoiceOrder.selected_edition.includes('(') ? 1 : 2}>Qty: {qty}</td>
                              <td className="border border-gray-300 p-3">{prices[name]} BDT each</td>
                              <td className="border border-gray-300 p-3 text-right font-medium">{(prices[name] * qty).toLocaleString()} BDT</td>
                            </tr>
                          );
                        });
                      }
                      // Lifestyle only: don't show accessories at all
                      return null;
                    })()}
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
                    <div className="flex justify-between py-2">
                      <span>COD Amount:</span>
                      <span>{invoiceOrder.payment_method === 'online' ? '0' : invoiceOrder.total_amount.toLocaleString()} BDT</span>
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
                            body { 
                              font-family: Arial, sans-serif; 
                              margin: 0; 
                              padding: 15px;
                              font-size: 12px;
                              line-height: 1.4;
                            }
                            .invoice-content { 
                              max-width: 100%; 
                              margin: 0 auto;
                              border: 2px solid #000;
                              padding: 15px;
                            }
                            .header {
                              text-align: center;
                              border-bottom: 2px solid #000;
                              padding-bottom: 10px;
                              margin-bottom: 15px;
                            }
                            .company-name { font-size: 24px; font-weight: bold; }
                            .invoice-title { font-size: 18px; margin-top: 5px; }
                            .info-grid {
                              display: grid;
                              grid-template-columns: 1fr 1fr;
                              gap: 20px;
                              margin-bottom: 15px;
                            }
                            .section-title {
                              font-weight: bold;
                              border-bottom: 1px solid #000;
                              padding-bottom: 3px;
                              margin-bottom: 8px;
                            }
                            .info-line { margin-bottom: 3px; }
                            .product-table {
                              width: 100%;
                              border-collapse: collapse;
                              margin: 15px 0;
                            }
                            .product-table th,
                            .product-table td {
                              border: 1px solid #000;
                              padding: 8px;
                              text-align: left;
                            }
                            .product-table th {
                              background-color: #f0f0f0;
                              font-weight: bold;
                            }
                            .totals {
                              width: 250px;
                              margin-left: auto;
                              border: 1px solid #000;
                            }
                            .totals tr td {
                              padding: 5px 10px;
                              border-bottom: 1px solid #ccc;
                            }
                            .total-final {
                              font-weight: bold;
                              font-size: 14px;
                              background-color: #f0f0f0;
                            }
                            .footer {
                              text-align: center;
                              margin-top: 15px;
                              padding-top: 10px;
                              border-top: 1px solid #000;
                              font-size: 10px;
                            }
                            .no-print { display: none !important; }
                            @page { size: A4; margin: 0.5cm; }
                          </style>
                        </head>
                        <body>
                          <div class="invoice-content">
                            <div class="header">
                              <div class="company-name">XIMPUL</div>
                              <div class="invoice-title">INVOICE</div>
                            </div>
                            
                            <div class="info-grid">
                              <div>
                                <div class="section-title">Bill To:</div>
                                <div class="info-line"><strong>${invoiceOrder.customer_name}</strong></div>
                                <div class="info-line">${invoiceOrder.customer_phone}</div>
                                ${invoiceOrder.customer_email ? `<div class="info-line">${invoiceOrder.customer_email}</div>` : ''}
                                <div class="info-line">${invoiceOrder.customer_address.replace(/\n/g, '<br>')}</div>
                                ${invoiceOrder.privacy_preference ? '<div class="info-line" style="color: #666; font-style: italic;">Private Order</div>' : ''}
                              </div>
                              
                              <div>
                                <div class="section-title">Invoice Details:</div>
                                <div class="info-line"><strong>Invoice #:</strong> ${invoiceOrder.order_id}</div>
                                <div class="info-line"><strong>Date:</strong> ${new Date(invoiceOrder.created_at).toLocaleDateString()}</div>
                                <div class="info-line"><strong>Status:</strong> ${invoiceOrder.order_status}</div>
                                <div class="info-line"><strong>Payment:</strong> ${invoiceOrder.payment_method === 'online' ? 'completed' : invoiceOrder.payment_status}</div>
                                <div class="info-line"><strong>Method:</strong> ${invoiceOrder.payment_method}</div>
                              </div>
                            </div>
                            
                            <table class="product-table">
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Details</th>
                                  ${!invoiceOrder.selected_edition.includes('(') ? '<th>Color</th>' : ''}
                                  <th>Notes</th>
                                  <th style="text-align: right;">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Ximpul Flow Water Bottle</td>
                                  <td>${invoiceOrder.selected_edition}</td>
                                  ${!invoiceOrder.selected_edition.includes('(') ? `<td>${invoiceOrder.selected_color === 'obsidian' ? 'Obsidian Black' : 'Graphite Grey'}</td>` : ''}
                                  <td>${invoiceOrder.engraving_text ? `Engraved: "${invoiceOrder.engraving_text}"` : 'No engraving'}</td>
                                  <td style="text-align: right;">${invoiceOrder.subtotal.toLocaleString()} BDT</td>
                                </tr>
                                ${invoiceOrder.selected_accessories && invoiceOrder.selected_accessories.length > 0 ? (() => {
                                  const hasLifestyle = invoiceOrder.selected_edition.toLowerCase().includes('lifestyle');
                                  const hasBase = invoiceOrder.selected_edition.toLowerCase().includes('base');
                                  const prices = { 'Straw Cap': 350, 'Cleaning Brush': 90, 'Straw Cleaning Brush': 50, 'Aluminimum Hook': 90 };
                                  let rows = '';
                                  
                                  const parseAccessory = (accStr) => {
                                    const match = accStr.match(/^(.+?)\s*×\s*(\d+)$/);
                                    if (match) {
                                      return { name: match[1], qty: parseInt(match[2]) };
                                    }
                                    return { name: accStr, qty: 1 };
                                  };
                                  
                                  // Only show accessories for Base Edition
                                  if (hasBase && !hasLifestyle) {
                                    invoiceOrder.selected_accessories.forEach(accStr => {
                                      const { name, qty } = parseAccessory(accStr);
                                      rows += `
                                        <tr>
                                          <td>${name}</td>
                                          <td>Qty: ${qty}</td>
                                          ${!invoiceOrder.selected_edition.includes('(') ? '<td></td>' : ''}
                                          <td>${prices[name]} BDT each</td>
                                          <td style="text-align: right;">${(prices[name] * qty).toLocaleString()} BDT</td>
                                        </tr>
                                      `;
                                    });
                                  } else if (hasLifestyle && hasBase) {
                                    // Show only Base Edition accessories (charged)
                                    invoiceOrder.selected_accessories.forEach(accStr => {
                                      const { name, qty } = parseAccessory(accStr);
                                      rows += `
                                        <tr>
                                          <td>${name} (for Base Edition)</td>
                                          <td>Qty: ${qty}</td>
                                          ${!invoiceOrder.selected_edition.includes('(') ? '<td></td>' : ''}
                                          <td>${prices[name]} BDT each</td>
                                          <td style="text-align: right;">${(prices[name] * qty).toLocaleString()} BDT</td>
                                        </tr>
                                      `;
                                    });
                                  }
                                  // Lifestyle only: don't show accessories at all
                                  return rows;
                                })() : ''}
                              </tbody>
                            </table>
                            
                            <table class="totals">
                              <tr>
                                <td>Subtotal:</td>
                                <td style="text-align: right;">${invoiceOrder.subtotal.toLocaleString()} BDT</td>
                              </tr>
                              <tr>
                                <td>Delivery Fee:</td>
                                <td style="text-align: right;">${invoiceOrder.delivery_fee.toLocaleString()} BDT</td>
                              </tr>
                              <tr>
                                <td>COD Amount:</td>
                                <td style="text-align: right;">${invoiceOrder.payment_method === 'online' ? '0' : invoiceOrder.total_amount.toLocaleString()} BDT</td>
                              </tr>
                              <tr class="total-final">
                                <td><strong>Total Amount:</strong></td>
                                <td style="text-align: right;"><strong>${invoiceOrder.total_amount.toLocaleString()} BDT</strong></td>
                              </tr>
                            </table>
                            
                            <div class="footer">
                              <div><strong>Ximpul - Making Water Free Again</strong></div>
                              <div>Thank you for choosing Ximpul Flow!</div>
                              <div>For support, contact us at ximpulshop@gmail.com</div>
                            </div>
                          </div>
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

      {/* Steadfast Parcel Details Modal */}
      <Dialog open={!!steadfastOrder} onOpenChange={(open) => !open && setSteadfastOrder(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-green-100 rounded-lg">
                <Truck className="h-6 w-6 text-green-700" />
              </div>
              Steadfast Parcel Details
            </DialogTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Order ID:</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">{steadfastOrder?.order_id}</span>
            </div>
          </DialogHeader>
          {steadfastOrder && (
            <div className="space-y-6 parcel-content">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Ximpul Parcel</h2>
                      <p className="text-green-700 font-medium">Ready for Steadfast Delivery</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Steadfast Parcel ID</p>
                    <p className="text-lg font-bold text-green-700">{steadfastParcelId}</p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">{steadfastOrder.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{steadfastOrder.customer_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-1">
                        <MapPin className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Delivery Address</p>
                        <p className="font-medium text-gray-900 whitespace-pre-wrap">{steadfastOrder.customer_address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Product</p>
                        <p className="font-medium text-gray-900">Ximpul Flow Water Bottle</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Edition</p>
                        <p className="font-medium text-gray-900">{steadfastOrder.selected_edition}</p>
                      </div>
                    </div>
                    {!steadfastOrder.selected_edition.includes('(') && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className={`w-4 h-4 rounded-full ${steadfastOrder.selected_color === 'obsidian' ? 'bg-black' : 'bg-gray-500'}`}></div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Color</p>
                          <p className="font-medium text-gray-900">{steadfastOrder.selected_color === 'obsidian' ? 'Obsidian Black' : 'Graphite Grey'}</p>
                        </div>
                      </div>
                    )}
                    {steadfastOrder.engraving_text && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mt-1">
                          <FileText className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Engraving</p>
                          <p className="font-medium text-gray-900 italic">"{steadfastOrder.engraving_text}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment & Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Number */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Order Number</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-800">{steadfastOrder.order_id}</p>
                </div>

                {/* Amount Details */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">Payment Details</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-700">Total Amount:</span>
                      <span className="font-bold text-green-800">{steadfastOrder.total_amount.toLocaleString()} BDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">COD Amount:</span>
                      <span className="font-bold text-green-800">{steadfastOrder.payment_method === 'online' ? '0' : steadfastOrder.total_amount.toLocaleString()} BDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Payment Method:</span>
                      <span className="font-medium text-green-800">{steadfastOrder.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}</span>
                    </div>
                    {steadfastOrder.payment_method === 'online' && (
                      <div className="mt-2 p-2 bg-green-200 rounded-lg">
                        <p className="text-green-800 text-sm font-medium flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Payment Completed Online
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Truck className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">Ximpul - Making Water Free Again</p>
                </div>
                <p className="text-gray-600">Parcel created via Steadfast Courier Service</p>
                <p className="text-sm text-gray-500 mt-1">Track your delivery with Parcel ID: <span className="font-mono font-medium">{steadfastParcelId}</span></p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t no-print">
                <Button variant="outline" onClick={() => setSteadfastOrder(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  const barcodeDataUrl = generateBarcode(steadfastParcelId);
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Sticker - ${steadfastOrder.order_id}</title>
                          <style>
                            body { 
                              font-family: Arial, sans-serif; 
                              margin: 0; 
                              padding: 0;
                              color: black;
                              background: white;
                            }
                            .parcel-content { 
                              width: 5cm;
                              height: 7cm;
                              padding: 0.2cm;
                              border: 1px solid black;
                              box-sizing: border-box;
                            }
                            .text-center { text-align: center; }
                            .font-bold { font-weight: bold; }
                            .font-extra-bold { font-weight: 900; }
                            .text-xs { font-size: 10px; line-height: 1.2; }
                            .text-xxs { font-size: 8px; line-height: 1.1; }
                            .text-lg { font-size: 14px; line-height: 1.1; font-weight: 900; }
                            .text-xl { font-size: 16px; line-height: 1.0; font-weight: 900; }
                            .mb-1 { margin-bottom: 0.05in; }
                            .barcode-img { width: 100%; height: auto; max-width: 4cm; }
                            p { margin: 0; padding: 0; }
                            h1 { font-size: 12px; margin: 0 0 0.05in 0; }
                            @page { 
                              size: 5cm 7cm; 
                              margin: 0;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="parcel-content">
                            <div class="text-center mb-1">
                              <h1 class="font-bold">XIMPUL</h1>
                            </div>
                            
                            <div class="mb-1">
                              <p class="font-bold text-xs">Customer:</p>
                              <p class="text-xxs">${steadfastOrder.customer_name}-${steadfastOrder.customer_phone}</p>
                            </div>
                            
                            <div class="mb-1">
                              <p class="text-xxs">${steadfastOrder.customer_address}</p>
                            </div>
                            
                            <div class="mb-1">
                              <p class="font-bold text-xs">Order Details:</p>
                              <p class="text-xxs">Ximpul Flow Water Bottle</p>
                              <p class="text-xxs">Edition: <span class="font-bold">${steadfastOrder.selected_edition}</span></p>
                              ${!steadfastOrder.selected_edition.includes('(') ? `<p class="text-xxs">Color: <span class="font-bold">${steadfastOrder.selected_color === 'obsidian' ? 'Obsidian Black' : 'Graphite Grey'}</span></p>` : ''}
                              ${steadfastOrder.selected_accessories && steadfastOrder.selected_accessories.length > 0 ? `<p class="text-xxs">Accessories: <span class="font-bold">${steadfastOrder.selected_accessories.join(', ')}</span></p>` : ''}
                              ${steadfastOrder.engraving_text ? `<p class="text-xxs">Engraved: <span class="font-bold">${steadfastOrder.engraving_text}</span></p>` : ''}
                            </div>
                            
                            <div class="mb-1">
                              <p class="text-xs">Order ID: ${steadfastOrder.order_id}</p>
                              <p class="font-bold text-xs">Steadfast ID:</p>
                              <div style="border: 2px solid black; padding: 0.1cm; text-align: center; margin: 0.05cm 0;">
                                <p class="text-xl font-bold">${steadfastParcelId}</p>
                              </div>
                              ${barcodeDataUrl ? `
                              <div class="text-center" style="margin-top: 0.1cm;">
                                <img src="${barcodeDataUrl}" class="barcode-img" alt="Barcode" />
                              </div>` : ''}
                            </div>
                            

                          </div>
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
                  Print Parcel Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Entry Modal */}
      <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manual Order Entry
            </DialogTitle>
            <DialogDescription>Create a new order manually with customer and product details</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={manualOrderData.customer_name}
                    onChange={(e) => setManualOrderData(prev => ({ ...prev, customer_name: e.target.value }))}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_phone">Phone Number *</Label>
                  <Input
                    id="customer_phone"
                    value={manualOrderData.customer_phone}
                    onChange={(e) => setManualOrderData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer_email">Email (Optional)</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={manualOrderData.customer_email}
                  onChange={(e) => setManualOrderData(prev => ({ ...prev, customer_email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="customer_address">Address *</Label>
                <Textarea
                  id="customer_address"
                  value={manualOrderData.customer_address}
                  onChange={(e) => setManualOrderData(prev => ({ ...prev, customer_address: e.target.value }))}
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Product Information</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">Base Edition (1,190 BDT each)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="base_black">Obsidian Black</Label>
                      <Input
                        id="base_black"
                        type="number"
                        min="0"
                        value={manualOrderData.base_black}
                        onChange={(e) => {
                          setManualOrderData(prev => ({ ...prev, base_black: parseInt(e.target.value) || 0 }));
                          setTimeout(updateManualOrderPricing, 0);
                        }}
                        placeholder="Qty"
                      />
                    </div>
                    <div>
                      <Label htmlFor="base_grey">Graphite Grey</Label>
                      <Input
                        id="base_grey"
                        type="number"
                        min="0"
                        value={manualOrderData.base_grey}
                        onChange={(e) => {
                          setManualOrderData(prev => ({ ...prev, base_grey: parseInt(e.target.value) || 0 }));
                          setTimeout(updateManualOrderPricing, 0);
                        }}
                        placeholder="Qty"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-3">Lifestyle Edition (1,650 BDT each)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="lifestyle_black">Obsidian Black</Label>
                      <Input
                        id="lifestyle_black"
                        type="number"
                        min="0"
                        value={manualOrderData.lifestyle_black}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 0;
                          setManualOrderData(prev => ({ ...prev, lifestyle_black: qty }));
                          setTimeout(updateManualOrderPricing, 0);
                        }}
                        placeholder="Qty"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lifestyle_grey">Graphite Grey</Label>
                      <Input
                        id="lifestyle_grey"
                        type="number"
                        min="0"
                        value={manualOrderData.lifestyle_grey}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 0;
                          setManualOrderData(prev => ({ ...prev, lifestyle_grey: qty }));
                          setTimeout(updateManualOrderPricing, 0);
                        }}
                        placeholder="Qty"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="accessories">Accessories (Only for Base Edition)</Label>
                {(manualOrderData.lifestyle_black + manualOrderData.lifestyle_grey) > 0 && (manualOrderData.base_black + manualOrderData.base_grey) > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Note: Lifestyle Edition includes all accessories. Selections below will be charged for Base Edition only.</p>
                )}
                {(manualOrderData.lifestyle_black + manualOrderData.lifestyle_grey) > 0 && (manualOrderData.base_black + manualOrderData.base_grey) === 0 && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">Note: Lifestyle Edition includes all accessories. No additional charges apply.</p>
                )}
                {(manualOrderData.base_black + manualOrderData.base_grey) > 0 && (manualOrderData.lifestyle_black + manualOrderData.lifestyle_grey) === 0 && (
                  <p className="text-xs text-blue-600 mt-1">Select accessories for Base Edition (charges apply).</p>
                )}
                <div className="space-y-2 mt-2">
                  {['Straw Cap', 'Cleaning Brush', 'Straw Cleaning Brush', 'Aluminimum Hook'].map((accessory) => {
                    const prices = { 'Straw Cap': 350, 'Cleaning Brush': 90, 'Straw Cleaning Brush': 50, 'Aluminimum Hook': 90 };
                    const isChecked = manualOrderData.selected_accessories.includes(accessory);
                    const qty = manualOrderData.accessory_quantities[accessory] || 1;
                    return (
                      <div key={accessory} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="checkbox"
                            id={accessory}
                            checked={isChecked}
                            disabled={(manualOrderData.lifestyle_black + manualOrderData.lifestyle_grey) > 0 && (manualOrderData.base_black + manualOrderData.base_grey) === 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setManualOrderData(prev => ({
                                  ...prev,
                                  selected_accessories: [...prev.selected_accessories, accessory],
                                  accessory_quantities: { ...prev.accessory_quantities, [accessory]: 1 }
                                }));
                              } else {
                                setManualOrderData(prev => ({
                                  ...prev,
                                  selected_accessories: prev.selected_accessories.filter(a => a !== accessory),
                                  accessory_quantities: { ...prev.accessory_quantities, [accessory]: 0 }
                                }));
                              }
                              setTimeout(updateManualOrderPricing, 0);
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={accessory} className="flex-1">{accessory}</Label>
                        </div>
                        {isChecked && (
                          <Input
                            type="number"
                            min="1"
                            value={qty}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              setManualOrderData(prev => ({
                                ...prev,
                                accessory_quantities: { ...prev.accessory_quantities, [accessory]: newQty }
                              }));
                              setTimeout(updateManualOrderPricing, 0);
                            }}
                            className="w-16 h-8 text-center"
                          />
                        )}
                        <span className="text-sm text-gray-600 w-20 text-right">{prices[accessory]} BDT{isChecked && qty > 1 ? ` × ${qty}` : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="engraving_text">Engraving Text (Optional)</Label>
                <Input
                  id="engraving_text"
                  value={manualOrderData.engraving_text}
                  onChange={(e) => setManualOrderData(prev => ({ ...prev, engraving_text: e.target.value }))}
                  placeholder="Enter engraving text"
                />
              </div>
            </div>

            {/* Payment & Order Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Payment & Order Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select value={manualOrderData.payment_method} onValueChange={(value) => {
                    setManualOrderData(prev => ({ ...prev, payment_method: value }));
                    setTimeout(updateManualOrderPricing, 0);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="privacy_preference"
                    checked={manualOrderData.privacy_preference}
                    onChange={(e) => setManualOrderData(prev => ({ ...prev, privacy_preference: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="privacy_preference">Private Order</Label>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  {manualOrderData.base_black > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Base Edition (Black) × {manualOrderData.base_black}:</span>
                      <span>{(1190 * manualOrderData.base_black).toLocaleString()} BDT</span>
                    </div>
                  )}
                  {manualOrderData.base_grey > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Base Edition (Grey) × {manualOrderData.base_grey}:</span>
                      <span>{(1190 * manualOrderData.base_grey).toLocaleString()} BDT</span>
                    </div>
                  )}
                  {manualOrderData.lifestyle_black > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Lifestyle Edition (Black) × {manualOrderData.lifestyle_black}:</span>
                      <span>{(1650 * manualOrderData.lifestyle_black).toLocaleString()} BDT</span>
                    </div>
                  )}
                  {manualOrderData.lifestyle_grey > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Lifestyle Edition (Grey) × {manualOrderData.lifestyle_grey}:</span>
                      <span>{(1650 * manualOrderData.lifestyle_grey).toLocaleString()} BDT</span>
                    </div>
                  )}
                  {manualOrderData.selected_accessories.length > 0 && (() => {
                    const prices = { 'Straw Cap': 350, 'Cleaning Brush': 90, 'Straw Cleaning Brush': 50, 'Aluminimum Hook': 90 };
                    const hasLifestyle = (manualOrderData.lifestyle_black + manualOrderData.lifestyle_grey) > 0;
                    const hasBase = (manualOrderData.base_black + manualOrderData.base_grey) > 0;
                    
                    if (hasLifestyle && hasBase) {
                      return (
                        <>
                          <div className="flex justify-between text-sm text-gray-500 italic">
                            <span>Accessories (Included with Lifestyle):</span>
                            <span>0 BDT</span>
                          </div>
                          {manualOrderData.selected_accessories.map((acc) => {
                            const qty = manualOrderData.accessory_quantities[acc] || 1;
                            return (
                              <div key={acc} className="flex justify-between text-sm text-gray-600">
                                <span>{acc} × {qty} (for Base Edition):</span>
                                <span>{(prices[acc] * qty).toLocaleString()} BDT</span>
                              </div>
                            );
                          })}
                        </>
                      );
                    } else if (hasLifestyle) {
                      return (
                        <div className="flex justify-between text-sm text-gray-500 italic">
                          <span>Accessories (Included with Lifestyle):</span>
                          <span>0 BDT</span>
                        </div>
                      );
                    } else {
                      return manualOrderData.selected_accessories.map((acc) => {
                        const qty = manualOrderData.accessory_quantities[acc] || 1;
                        return (
                          <div key={acc} className="flex justify-between text-sm text-gray-600">
                            <span>{acc} × {qty}:</span>
                            <span>{(prices[acc] * qty).toLocaleString()} BDT</span>
                          </div>
                        );
                      });
                    }
                  })()}
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Subtotal:</span>
                    <span>{manualOrderData.subtotal.toLocaleString()} BDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee {manualOrderData.payment_method === 'cod' ? '(COD)' : '(Online)'}:</span>
                    <span>{manualOrderData.delivery_fee.toLocaleString()} BDT</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{manualOrderData.total_amount.toLocaleString()} BDT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualEntryOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateManualOrder} disabled={isCreatingOrder}>
              {isCreatingOrder ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
};