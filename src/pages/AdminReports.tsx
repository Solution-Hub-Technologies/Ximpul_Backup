import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrders } from '@/hooks/useOrders';
import { useBulkOrders } from '@/hooks/useBulkOrders';
import { 
  Calendar, TrendingUp, DollarSign, Package, 
  CreditCard, Truck, BarChart3, PieChart,
  FileSpreadsheet, Download, RefreshCw, Banknote, Smartphone, Eye
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminReports = () => {
  const { orders, isLoading, fetchOrders } = useOrders();
  const { bulkOrders, isLoading: bulkOrdersLoading } = useBulkOrders();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState('');

  // Filter orders by date range and exclude pending payment, leads, and cancelled orders
  const getFilteredOrders = () => {
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
      const matchesDateRange = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);
      const isValidOrder = !(order.order_status === 'pending_payment' || (order.order_status === 'pending' && order.payment_status === 'pending') || order.order_status === 'cancelled');
      return matchesDateRange && isValidOrder;
    });
  };

  const filteredOrders = getFilteredOrders();

  // Calculate bulk order revenue (all bulk orders, not just delivered)
  const filteredBulkOrders = bulkOrders.filter(order => {
    const orderDate = new Date(order.created_at);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    return (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);
  });

  const bulkRevenue = filteredBulkOrders.reduce((sum, order) => {
    if (!order.pricing_data) return sum;
    const productRevenue = order.pricing_data.products?.reduce((pSum, p, idx) => 
      pSum + ((p.unit_price || 0) * parseInt(order.products[idx]?.quantity || 0)), 0) || 0;
    const accessoryRevenue = order.pricing_data.products?.reduce((pSum, p, idx) => {
      const accPrice = p.accessories?.reduce((aSum, acc, accIdx) => 
        aSum + ((acc.unit_price || 0) * (order.products[idx]?.accessories?.[accIdx]?.quantity || 0)), 0) || 0;
      return pSum + accPrice;
    }, 0) || 0;
    const engravingRevenue = (order.pricing_data.engraving_price || 0) * 
      order.products.reduce((s, p) => s + parseInt(p.quantity || 0), 0);
    return sum + productRevenue + accessoryRevenue + engravingRevenue;
  }, 0);

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const codOrders = filteredOrders.filter(order => order.payment_method === 'cod');
  const onlineOrders = filteredOrders.filter(order => order.payment_method === 'online');
  const codRevenue = codOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const onlineRevenue = onlineOrders.reduce((sum, order) => sum + order.total_amount, 0);
  
  // Count manual orders
  const manualOrders = filteredOrders.filter(order => {
    const edition = order.selected_edition.toLowerCase();
    return edition.includes('×') || edition.includes('(');
  });
  const manualOrdersCount = manualOrders.length;
  
  // Calculate engraving revenue (150 BDT per engraving)
  const engravingStats = filteredOrders.reduce((acc, order) => {
    let count = 0;
    let revenue = 0;
    
    const edition = order.selected_edition.toLowerCase();
    
    // Check if manual order with multiple editions
    if (edition.includes('×') || edition.includes('(')) {
      // Parse manual order to count total quantity
      const parts = order.selected_edition.split(',').map(p => p.trim());
      const totalQty = parts.reduce((sum, part) => {
        const qtyMatch = part.match(/×\s*(\d+)/);
        return sum + (qtyMatch ? parseInt(qtyMatch[1]) : 1);
      }, 0);
      
      if (order.engraving_text && order.engraving_text.trim() !== '') {
        count = totalQty;
        revenue = totalQty * 150;
      }
    } else if (order.engraving_text && order.engraving_text.trim() !== '') {
      // Regular orders with engraving
      count = 1;
      revenue = 150;
    }
    
    return {
      count: acc.count + count,
      revenue: acc.revenue + revenue
    };
  }, { count: 0, revenue: 0 });
  
  const engravingRevenue = engravingStats.revenue;
  const totalEngravingCount = engravingStats.count;

  const openModal = (type) => {
    let data = [];
    let title = '';
    
    if (type === 'total') {
      data = filteredOrders;
      title = 'All Orders';
    } else if (type === 'online') {
      data = onlineOrders;
      title = 'Online Payment Orders';
    } else if (type === 'cod') {
      data = codOrders;
      title = 'Cash on Delivery Orders';
    } else if (type === 'bulk') {
      data = filteredBulkOrders;
      title = 'Bulk Orders';
    }
    
    setModalData(data);
    setModalTitle(title);
    setModalOpen(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const exportReport = (type: string) => {
    if (type === 'complete') {
      // Export both website and bulk orders in one CSV
      const websiteData = filteredOrders.map(order => {
        const edition = order.selected_edition.toLowerCase();
        let totalQuantity = 1;
        let isManual = false;
        
        // Calculate quantity for manual orders
        if (edition.includes('×') || edition.includes('(')) {
          isManual = true;
          const parts = order.selected_edition.split(',').map(p => p.trim());
          totalQuantity = parts.reduce((sum, part) => {
            const qtyMatch = part.match(/×\s*(\d+)/);
            return sum + (qtyMatch ? parseInt(qtyMatch[1]) : 1);
          }, 0);
        }
        
        return {
          'Type': 'Website Order',
          'Order ID': order.order_id,
          'Manual': isManual ? 'Yes' : 'No',
          'Date': new Date(order.created_at).toLocaleDateString(),
          'Customer': order.customer_name,
          'Phone': order.customer_phone,
          'Email': order.customer_email || 'N/A',
          'Location': order.customer_address || 'N/A',
          'Products': order.selected_edition,
          'Color': order.selected_color === 'obsidian' ? 'OBSIDIAN BLACK' : 'GRAPHITE GREY',
          'Quantity': totalQuantity,
          'Accessories': order.selected_accessories && order.selected_accessories.length > 0 ? order.selected_accessories.join(', ') : 'None',
          'Payment Method': order.payment_method.toUpperCase(),
          'Amount (৳)': order.total_amount,
          'Status': order.order_status,
          'Payment Status': order.payment_status
        };
      });

      const bulkData = filteredBulkOrders.map(order => ({
        'Type': 'Bulk Order',
        'Order ID': order.id,
        'Date': new Date(order.created_at).toLocaleDateString(),
        'Customer': order.customer_name,
        'Phone': order.customer_phone,
        'Email': order.customer_email,
        'Location': order.customer_location,
        'Products': order.products.map(p => `${p.model} (${p.color}) × ${p.quantity}`).join(', '),
        'Color': 'Multiple',
        'Quantity': order.products.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0),
        'Accessories': order.products.some(p => p.accessories && p.accessories.length > 0) ? 'Yes' : 'None',
        'Payment Method': 'BULK',
        'Amount (৳)': order.pricing_data ? 
          (order.pricing_data.products?.reduce((sum, p, idx) => 
            sum + ((p.unit_price || 0) * parseInt(order.products[idx]?.quantity || 0)), 0) || 0) +
          (order.pricing_data.products?.reduce((sum, p, idx) => {
            const accPrice = p.accessories?.reduce((aSum, acc, accIdx) => 
              aSum + ((acc.unit_price || 0) * (order.products[idx]?.accessories?.[accIdx]?.quantity || 0)), 0) || 0;
            return sum + accPrice;
          }, 0) || 0) +
          ((order.pricing_data.engraving_price || 0) * order.products.reduce((s, p) => s + parseInt(p.quantity || 0), 0))
          : 0,
        'Status': order.status,
        'Payment Status': 'N/A'
      }));

      const combinedData = [...websiteData, ...bulkData];
      const headers = Object.keys(combinedData[0] || {});
      const csvContent = [headers, ...combinedData.map(row => headers.map(h => row[h]))]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ximpul-complete-report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('Complete report exported successfully');
      return;
    }

    // Regular export for other types
    const exportData = type === 'cod' ? codOrders : type === 'online' ? onlineOrders : filteredOrders;
    const data = exportData.map(order => {
      const edition = order.selected_edition.toLowerCase();
      let totalQuantity = 1;
      let isManual = false;
      
      // Calculate quantity for manual orders
      if (edition.includes('×') || edition.includes('(')) {
        isManual = true;
        const parts = order.selected_edition.split(',').map(p => p.trim());
        totalQuantity = parts.reduce((sum, part) => {
          const qtyMatch = part.match(/×\s*(\d+)/);
          return sum + (qtyMatch ? parseInt(qtyMatch[1]) : 1);
        }, 0);
      }
      
      return {
        'Order ID': order.order_id,
        'Manual': isManual ? 'Yes' : 'No',
        'Date': new Date(order.created_at).toLocaleDateString(),
        'Customer': order.customer_name,
        'Phone': order.customer_phone,
        'Edition': order.selected_edition,
        'Color': order.selected_color === 'obsidian' ? 'OBSIDIAN BLACK' : 'GRAPHITE GREY',
        'Quantity': totalQuantity,
        'Accessories': order.selected_accessories && order.selected_accessories.length > 0 ? order.selected_accessories.join(', ') : 'None',
        'Payment Method': order.payment_method.toUpperCase(),
        'Amount (৳)': order.total_amount,
        'Status': order.order_status,
        'Payment Status': order.payment_status
      };
    });

    const headers = Object.keys(data[0] || {});
    const csvContent = [headers, ...data.map(row => headers.map(h => row[h]))]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ximpul-${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`${type} report exported successfully`);
  };

  const exportBulkOrderReport = () => {
    const data = filteredBulkOrders.map(order => ({
      'Order ID': order.id,
      'Date': new Date(order.created_at).toLocaleDateString(),
      'Customer': order.customer_name,
      'Email': order.customer_email,
      'Phone': order.customer_phone,
      'Location': order.customer_location,
      'Products': order.products.map(p => `${p.model} (${p.color}) × ${p.quantity}`).join(', '),
      'Total Quantity': order.products.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0),
      'Timeline': order.timeline || 'Not specified',
      'Engraving': order.engraving || 'None',
      'Status': order.status,
      'Total Revenue': order.pricing_data ? 
        (order.pricing_data.products?.reduce((sum, p, idx) => 
          sum + ((p.unit_price || 0) * parseInt(order.products[idx]?.quantity || 0)), 0) || 0) +
        (order.pricing_data.products?.reduce((sum, p, idx) => {
          const accPrice = p.accessories?.reduce((aSum, acc, accIdx) => 
            aSum + ((acc.unit_price || 0) * (order.products[idx]?.accessories?.[accIdx]?.quantity || 0)), 0) || 0;
          return sum + accPrice;
        }, 0) || 0) +
        ((order.pricing_data.engraving_price || 0) * order.products.reduce((s, p) => s + parseInt(p.quantity || 0), 0))
        : 0
    }));

    const headers = Object.keys(data[0] || {});
    const csvContent = [headers, ...data.map(row => headers.map(h => row[h]))]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ximpul-bulk-orders-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Bulk order report exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-lg font-medium">Loading reports...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Reports</h1>
              <p className="text-gray-600">Comprehensive revenue and order analytics</p>
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

        {/* Date Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Date Range Filter</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="h-10 px-4"
              >
                Clear Dates
              </Button>
            </div>
          </div>

          {(dateFrom || dateTo) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Showing data from {dateFrom || 'beginning'} to {dateTo || 'now'}
              </p>
            </div>
          )}
        </div>

        {/* Overall Dashboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Business Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Total Business Revenue</p>
                  <p className="text-3xl font-bold text-emerald-800">৳{(totalRevenue + bulkRevenue).toLocaleString()}</p>
                  <p className="text-sm text-emerald-600 mt-1">Website + Bulk Orders</p>
                </div>
                <div className="p-3 bg-emerald-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-700">৳</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-700">Website Revenue</p>
                  <p className="text-3xl font-bold text-blue-800">৳{totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-blue-600 mt-1">{filteredOrders.length} orders</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <Smartphone className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-indigo-700">Bulk Order Revenue</p>
                  <p className="text-3xl font-bold text-indigo-800">৳{bulkRevenue.toLocaleString()}</p>
                  <p className="text-sm text-indigo-600 mt-1">{filteredBulkOrders.length} orders</p>
                </div>
                <div className="p-3 bg-indigo-200 rounded-lg">
                  <Package className="h-6 w-6 text-indigo-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Website Revenue Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Website Revenue Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200 relative">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Revenue Overview</p>
                  <p className="text-3xl font-bold text-green-800">৳{totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-green-600 mt-1">{filteredOrders.length} orders ({manualOrdersCount} manual)</p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-700">৳</span>
                </div>
              </div>
              <button 
                onClick={() => openModal('total')}
                className="absolute top-2 right-2 p-2 bg-green-200/80 hover:bg-green-300 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                title="View all orders"
              >
                <Eye className="h-4 w-4 text-green-700" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 relative">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-700">Online Payments</p>
                  <p className="text-3xl font-bold text-blue-800">৳{onlineRevenue.toLocaleString()}</p>
                  <p className="text-sm text-blue-600 mt-1">{onlineOrders.length} orders</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-lg">
                  <Smartphone className="h-6 w-6 text-blue-700" />
                </div>
              </div>
              <button 
                onClick={() => openModal('online')}
                className="absolute top-2 right-2 p-2 bg-blue-200/80 hover:bg-blue-300 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                title="View online orders"
              >
                <Eye className="h-4 w-4 text-blue-700" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200 relative">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-orange-700">Cash on Delivery</p>
                  <p className="text-3xl font-bold text-orange-800">৳{codRevenue.toLocaleString()}</p>
                  <p className="text-sm text-orange-600 mt-1">{codOrders.length} orders</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-lg">
                  <Banknote className="h-6 w-6 text-orange-700" />
                </div>
              </div>
              <button 
                onClick={() => openModal('cod')}
                className="absolute top-2 right-2 p-2 bg-orange-200/80 hover:bg-orange-300 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                title="View COD orders"
              >
                <Eye className="h-4 w-4 text-orange-700" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-purple-700">Engraving Revenue</p>
                  <p className="text-3xl font-bold text-purple-800">৳{engravingRevenue.toLocaleString()}</p>
                  <p className="text-sm text-purple-600 mt-1">{totalEngravingCount} engravings</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <span className="text-2xl font-bold text-purple-700">✒</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Sale Report and Accessories Report */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Sale Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Sale Report</h2>
            <div className="space-y-4">
              {(() => {
                const productStats = {};
                let baseRevenue = 0;
                let lifestyleRevenue = 0;
                
                filteredOrders.forEach(order => {
                  const edition = order.selected_edition.toLowerCase();
                  
                  // Check if this is a manual order (contains × or parentheses)
                  if (edition.includes('×') || edition.includes('(')) {
                    // Parse manual order format: "Base Edition (Black) × 40, base edition (grey) × 20"
                    const parts = order.selected_edition.split(',').map(p => p.trim());
                    
                    parts.forEach(part => {
                      const lowerPart = part.toLowerCase();
                      let qty = 1;
                      let editionType = '';
                      let color = '';
                      
                      // Extract quantity
                      const qtyMatch = part.match(/×\s*(\d+)/);
                      if (qtyMatch) {
                        qty = parseInt(qtyMatch[1]);
                      }
                      
                      // Determine edition type
                      if (lowerPart.includes('base')) {
                        editionType = 'base edition';
                      } else if (lowerPart.includes('lifestyle')) {
                        editionType = 'lifestyle edition';
                      }
                      
                      // Determine color
                      if (lowerPart.includes('black')) {
                        color = 'Obsidian Black';
                      } else if (lowerPart.includes('grey') || lowerPart.includes('gray')) {
                        color = 'Graphite Grey';
                      }
                      
                      if (editionType && color) {
                        const key = `Ximpul-${editionType}-${color}`;
                        if (!productStats[key]) productStats[key] = { count: 0, revenue: 0 };
                        productStats[key].count += qty;
                        
                        const price = editionType === 'base edition' ? 1190 : 1650;
                        productStats[key].revenue += qty * price;
                        
                        if (editionType === 'base edition') {
                          baseRevenue += qty * price;
                        } else {
                          lifestyleRevenue += qty * price;
                        }
                      }
                    });
                  } else {
                    // Handle regular orders
                    const color = order.selected_color === 'obsidian' ? 'Obsidian Black' : 'Graphite Grey';
                    
                    // Normalize edition name
                    let editionType = '';
                    if (edition.includes('base')) {
                      editionType = 'base edition';
                    } else if (edition.includes('lifestyle')) {
                      editionType = 'lifestyle edition';
                    }
                    
                    const key = `Ximpul-${editionType}-${color}`;
                    
                    if (!productStats[key]) {
                      productStats[key] = { count: 0, revenue: 0 };
                    }
                    productStats[key].count += 1;
                    
                    const productPrice = editionType === 'base edition' ? 1190 : 1650;
                    productStats[key].revenue += productPrice;
                    
                    if (editionType === 'base edition') {
                      baseRevenue += productPrice;
                    } else if (editionType === 'lifestyle edition') {
                      lifestyleRevenue += productPrice;
                    }
                  }
                });
                
                const totalProductCount = Object.values(productStats).reduce((sum, stat) => sum + stat.count, 0);
                const totalProductRevenue = baseRevenue + lifestyleRevenue;
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">Total Product Sold</p>
                        <p className="text-2xl font-bold text-blue-800">{totalProductCount}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">Product Revenue</p>
                        <p className="text-2xl font-bold text-blue-800">৳{totalProductRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {Object.keys(productStats).length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No products sold in this period
                        </div>
                      ) : (
                        Object.entries(productStats).map(([product, stats]) => (
                          <div key={product} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="font-medium">{product}</span>
                            <div className="text-right">
                              <p className="font-semibold">{stats.count} sold</p>
                              <p className="text-sm text-gray-600">৳{stats.revenue.toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Accessories Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Accessories Sale Report</h2>
          <div className="space-y-4">
            {(() => {
              const accessoryStats = {};
              filteredOrders.forEach(order => {
                // Handle both array and string formats
                let accessories = [];
                if (order.selected_accessories) {
                  if (Array.isArray(order.selected_accessories)) {
                    accessories = order.selected_accessories;
                  } else if (typeof order.selected_accessories === 'string') {
                    try {
                      accessories = JSON.parse(order.selected_accessories);
                    } catch {
                      accessories = [];
                    }
                  }
                }
                
                if (accessories.length > 0) {
                  accessories.forEach(accStr => {
                    // Parse accessory name and quantity (e.g., "Straw Cap × 2")
                    const match = accStr.match(/^(.+?)\s*×\s*(\d+)$/);
                    const accessory = match ? match[1] : accStr;
                    const qty = match ? parseInt(match[2]) : 1;
                    
                    if (!accessoryStats[accessory]) {
                      accessoryStats[accessory] = { count: 0, revenue: 0 };
                    }
                    accessoryStats[accessory].count += qty;
                    // Actual accessory prices
                    const accessoryPrice = accessory === 'Straw Cap' ? 350 : 
                                         accessory === 'Aluminium Hook' ? 90 : 
                                         accessory === 'Bottle Brush' ? 90 :
                                         accessory === 'Cleaning Brush' ? 90 :
                                         accessory === 'Straw Cleaning Brush' ? 50 : 0;
                    accessoryStats[accessory].revenue += accessoryPrice * qty;
                  });
                }
              });
              
              const totalAccessoryRevenue = Object.values(accessoryStats).reduce((sum, stat) => sum + stat.revenue, 0);
              const totalAccessoryCount = Object.values(accessoryStats).reduce((sum, stat) => sum + stat.count, 0);
              
              return (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-700">Total Accessories Sold</p>
                      <p className="text-2xl font-bold text-purple-800">{totalAccessoryCount}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-700">Accessories Revenue</p>
                      <p className="text-2xl font-bold text-purple-800">৳{totalAccessoryRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.keys(accessoryStats).length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No accessories sold in this period
                      </div>
                    ) : (
                      Object.entries(accessoryStats).map(([accessory, stats]) => (
                        <div key={accessory} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{accessory}</span>
                          <div className="text-right">
                            <p className="font-semibold">{stats.count} sold</p>
                            <p className="text-sm text-gray-600">৳{stats.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* COD Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cash on Delivery Report</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('cod')}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export COD
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-700">Total COD Orders</p>
                  <p className="text-2xl font-bold text-orange-800">{codOrders.length}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-700">COD Revenue</p>
                  <p className="text-2xl font-bold text-orange-800">৳{codRevenue.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending COD:</span>
                  <span className="font-medium">{codOrders.filter(o => o.order_status === 'pending').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing COD:</span>
                  <span className="font-medium">{codOrders.filter(o => o.order_status === 'processing').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivered COD:</span>
                  <span className="font-medium">{codOrders.filter(o => o.order_status === 'delivered').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Online Payment Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Online Payment Report</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('online')}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Online
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">Total Online Orders</p>
                  <p className="text-2xl font-bold text-blue-800">{onlineOrders.length}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">Online Revenue</p>
                  <p className="text-2xl font-bold text-blue-800">৳{onlineRevenue.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending Online:</span>
                  <span className="font-medium">{onlineOrders.filter(o => o.order_status === 'pending').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing Online:</span>
                  <span className="font-medium">{onlineOrders.filter(o => o.order_status === 'processing').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivered Online:</span>
                  <span className="font-medium">{onlineOrders.filter(o => o.order_status === 'delivered').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Order Sale Report */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Bulk Order Sale Report</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={exportBulkOrderReport}
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Bulk Orders
            </Button>
          </div>
          <div className="space-y-4">
            {(() => {
              const deliveredBulkOrders = bulkOrders.filter(order => {
                const orderDate = new Date(order.created_at);
                const fromDate = dateFrom ? new Date(dateFrom) : null;
                const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
                return (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);
              });

              const editionStats = {};
              const accessoryStats = {};

              const bulkStats = deliveredBulkOrders.reduce((acc, order) => {
                if (!order.pricing_data) return acc;
                
                const productRevenue = order.pricing_data.products?.reduce((pSum, p, idx) => 
                  pSum + ((p.unit_price || 0) * parseInt(order.products[idx]?.quantity || 0)), 0) || 0;
                
                const accessoryRevenue = order.pricing_data.products?.reduce((pSum, p, idx) => {
                  const accPrice = p.accessories?.reduce((aSum, acc, accIdx) => 
                    aSum + ((acc.unit_price || 0) * (order.products[idx]?.accessories?.[accIdx]?.quantity || 0)), 0) || 0;
                  return pSum + accPrice;
                }, 0) || 0;
                
                const engravingRevenue = (order.pricing_data.engraving_price || 0) * 
                  order.products.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);
                
                order.products.forEach((product, idx) => {
                  const key = `${product.model} - ${product.color}`;
                  const qty = parseInt(product.quantity || 0);
                  const unitPrice = order.pricing_data.products?.[idx]?.unit_price || 0;
                  
                  if (!editionStats[key]) editionStats[key] = { count: 0, revenue: 0 };
                  editionStats[key].count += qty;
                  editionStats[key].revenue += qty * unitPrice;

                  product.accessories?.forEach((accessory, accIdx) => {
                    const accQty = parseInt(accessory.quantity || 0);
                    const accUnitPrice = order.pricing_data.products?.[idx]?.accessories?.[accIdx]?.unit_price || 0;
                    
                    if (!accessoryStats[accessory.name]) accessoryStats[accessory.name] = { count: 0, revenue: 0 };
                    accessoryStats[accessory.name].count += accQty;
                    accessoryStats[accessory.name].revenue += accQty * accUnitPrice;
                  });
                });
                
                return {
                  productRevenue: acc.productRevenue + productRevenue,
                  accessoryRevenue: acc.accessoryRevenue + accessoryRevenue,
                  engravingRevenue: acc.engravingRevenue + engravingRevenue,
                  totalRevenue: acc.totalRevenue + productRevenue + accessoryRevenue + engravingRevenue
                };
              }, { productRevenue: 0, accessoryRevenue: 0, engravingRevenue: 0, totalRevenue: 0 });

              const totalBulkProducts = deliveredBulkOrders.reduce((sum, order) => 
                sum + order.products.reduce((pSum, p) => pSum + parseInt(p.quantity || 0), 0), 0);

              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-indigo-50 p-4 rounded-lg relative">
                      <p className="text-sm text-indigo-700">Total Bulk Orders</p>
                      <p className="text-2xl font-bold text-indigo-800">{deliveredBulkOrders.length}</p>
                      <button 
                        onClick={() => openModal('bulk')}
                        className="absolute top-2 right-2 p-1.5 bg-indigo-200/80 hover:bg-indigo-300 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                        title="View bulk orders"
                      >
                        <Eye className="h-3 w-3 text-indigo-700" />
                      </button>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-indigo-700">Total Products</p>
                      <p className="text-2xl font-bold text-indigo-800">{totalBulkProducts}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-indigo-700">Total Revenue</p>
                      <p className="text-2xl font-bold text-indigo-800">৳{bulkStats.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-700">Product Revenue</p>
                      <p className="text-2xl font-bold text-blue-800">৳{bulkStats.productRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-700">Accessory Revenue</p>
                      <p className="text-2xl font-bold text-purple-800">৳{bulkStats.accessoryRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-700">Engraving Revenue</p>
                      <p className="text-2xl font-bold text-yellow-800">৳{bulkStats.engravingRevenue.toLocaleString()}</p>
                    </div>
                  </div>

                  {deliveredBulkOrders.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-3">Edition Breakdown</h3>
                        <div className="space-y-2">
                          {Object.keys(editionStats).length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No editions found</div>
                          ) : (
                            Object.entries(editionStats).map(([edition, stats]) => (
                              <div key={edition} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <span className="font-medium">{edition}</span>
                                <div className="text-right">
                                  <p className="font-semibold">{stats.count} sold</p>
                                  <p className="text-sm text-gray-600">৳{stats.revenue.toLocaleString()}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-3">Accessories Breakdown</h3>
                        <div className="space-y-2">
                          {Object.keys(accessoryStats).length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No accessories found</div>
                          ) : (
                            Object.entries(accessoryStats).map(([accessory, stats]) => (
                              <div key={accessory} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <span className="font-medium">{accessory}</span>
                                <div className="text-right">
                                  <p className="font-semibold">{stats.count} sold</p>
                                  <p className="text-sm text-gray-600">৳{stats.revenue.toLocaleString()}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {deliveredBulkOrders.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No bulk orders in this period
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Export All Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => exportReport('complete')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Complete Report
            </Button>
            <Button
              variant="outline"
              onClick={() => exportReport('summary')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Export Summary
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">{modalTitle}</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {modalTitle === 'Bulk Orders' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edition</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modalData.map((order) => (
                      <tr key={order.order_id || order.id} className="hover:bg-gray-50">
                        {modalTitle === 'Bulk Orders' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_phone}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{order.products?.map(p => `${p.model} (${p.color})`).join(', ')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.products?.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                {order.order_id}
                                {(order.selected_edition.toLowerCase().includes('×') || order.selected_edition.toLowerCase().includes('(')) && (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                    Manual
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.selected_edition}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">৳{order.total_amount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.order_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.order_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};