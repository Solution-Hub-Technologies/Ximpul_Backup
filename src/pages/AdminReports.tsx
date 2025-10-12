import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrders } from '@/hooks/useOrders';
import { 
  Calendar, TrendingUp, DollarSign, Package, 
  CreditCard, Truck, BarChart3, PieChart,
  FileSpreadsheet, Download, RefreshCw, Banknote, Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

export const AdminReports = () => {
  const { orders, isLoading, fetchOrders } = useOrders();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filter orders by date range and exclude pending payment and cancelled orders
  const getFilteredOrders = () => {
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
      const matchesDateRange = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);
      const isValidOrder = order.order_status !== 'pending_payment' && order.order_status !== 'cancelled';
      return matchesDateRange && isValidOrder;
    });
  };

  const filteredOrders = getFilteredOrders();

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const codOrders = filteredOrders.filter(order => order.payment_method === 'cod');
  const onlineOrders = filteredOrders.filter(order => order.payment_method === 'online');
  const codRevenue = codOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const onlineRevenue = onlineOrders.reduce((sum, order) => sum + order.total_amount, 0);
  
  // Calculate engraving revenue (150 BDT per engraving)
  const engravingOrders = filteredOrders.filter(order => order.engraving_text && order.engraving_text.trim() !== '');
  const engravingRevenue = engravingOrders.length * 150;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const exportReport = (type: string) => {
    // Filter out pending payment and cancelled orders for exports
    const exportData = filteredOrders.filter(order => order.order_status !== 'pending_payment' && order.order_status !== 'cancelled');
    const data = exportData.map(order => ({
      'Order ID': order.order_id,
      'Date': new Date(order.created_at).toLocaleDateString(),
      'Customer': order.customer_name,
      'Phone': order.customer_phone,
      'Edition': order.selected_edition,
      'Color': order.selected_color === 'obsidian' ? 'OBSIDIAN BLACK' : 'GRAPHITE GREY',
      'Accessories': order.selected_accessories && order.selected_accessories.length > 0 ? order.selected_accessories.join(', ') : 'None',
      'Payment Method': order.payment_method.toUpperCase(),
      'Amount (৳)': order.total_amount,
      'Status': order.order_status,
      'Payment Status': order.payment_status
    }));

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

        {/* Revenue Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Revenue Overview</p>
                  <p className="text-3xl font-bold text-green-800">৳{totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-green-600 mt-1">{filteredOrders.length} orders</p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-700">৳</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
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
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
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
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-purple-700">Engraving Revenue</p>
                  <p className="text-3xl font-bold text-purple-800">৳{engravingRevenue.toLocaleString()}</p>
                  <p className="text-sm text-purple-600 mt-1">{engravingOrders.length} engravings</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <span className="text-2xl font-bold text-purple-700">✒</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accessories Report */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accessories Report</h2>
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
                  accessories.forEach(accessory => {
                    if (!accessoryStats[accessory]) {
                      accessoryStats[accessory] = { count: 0, revenue: 0 };
                    }
                    accessoryStats[accessory].count += 1;
                    // Actual accessory prices
                    const accessoryPrice = accessory === 'Straw Cap' ? 350 : 
                                         accessory === 'Aluminium Hook' ? 90 : 
                                         accessory === 'Bottle Brush' ? 90 :
                                         accessory === 'Cleaning Brush' ? 90 :
                                         accessory === 'Straw Cleaning Brush' ? 50 : 0;
                    accessoryStats[accessory].revenue += accessoryPrice;
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
    </div>
  );
};