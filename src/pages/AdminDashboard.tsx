import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useOrders } from '@/hooks/useOrders';
import { useProducts, useAccessories } from '@/hooks/useProducts';
import { 
  Package, Clock, CheckCircle, ShoppingBag, 
  TrendingUp, AlertTriangle, ArrowUpRight, Layers, 
  Calendar, ChevronRight, RefreshCw, CreditCard, Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { orders, isLoading: ordersLoading, fetchOrders } = useOrders();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: accessories, isLoading: accessoriesLoading } = useAccessories();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (ordersLoading || productsLoading || accessoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's orders
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= today && orderDate < tomorrow;
  });

  // Order statistics for today
  const stats = {
    totalOrdersToday: todayOrders.length,
    codOrdersToday: todayOrders.filter(order => order.payment_method === 'cod').length,
    onlineOrdersToday: todayOrders.filter(order => order.payment_method === 'online').length,
    revenueToday: todayOrders.reduce((sum, order) => sum + order.total_amount, 0)
  };

  // Low stock items
  const getLowStockItems = () => {
    const lowStockItems = [];
    
    // Check products
    products?.forEach(product => {
      const blackStock = product.stock_black || 0;
      const greyStock = product.stock_grey || 0;
      
      if (blackStock <= 5) {
        lowStockItems.push({
          name: `${product.name} (Black)`,
          stock: blackStock,
          type: 'product'
        });
      }
      if (greyStock <= 5) {
        lowStockItems.push({
          name: `${product.name} (Grey)`,
          stock: greyStock,
          type: 'product'
        });
      }
    });
    
    // Check accessories
    accessories?.forEach(accessory => {
      const defaultStock = accessory.stock_default || 0;
      const blackStock = accessory.stock_black || 0;
      const greyStock = accessory.stock_grey || 0;
      
      if (accessory.name.toLowerCase() === 'straw cap') {
        if (blackStock <= 5) {
          lowStockItems.push({
            name: `${accessory.name} (Black)`,
            stock: blackStock,
            type: 'accessory'
          });
        }
        if (greyStock <= 5) {
          lowStockItems.push({
            name: `${accessory.name} (Grey)`,
            stock: greyStock,
            type: 'accessory'
          });
        }
      } else if (defaultStock <= 5) {
        lowStockItems.push({
          name: accessory.name,
          stock: defaultStock,
          type: 'accessory'
        });
      }
    });
    
    return lowStockItems;
  };

  const lowStockItems = getLowStockItems();

  // Product statistics
  const productStats = {
    totalProducts: products?.length || 0,
    totalAccessories: accessories?.length || 0,
    // Assuming we track low stock items (for demo purposes)
    lowStockItems: 2,
    // Most popular edition based on orders
    popularEdition: products && products.length > 0 ? 
      products.reduce((popular, product) => {
        const orderCount = orders.filter(o => o.selected_edition === product.value).length;
        return orderCount > popular.count ? { name: product.name, count: orderCount } : popular;
      }, { name: '', count: 0 }) : { name: 'N/A', count: 0 }
  };

  // Recent orders
  const recentOrders = orders.slice(0, 5);

  // Product sales data
  const productSales = products ? products.map(product => {
    const salesCount = orders.filter(order => order.selected_edition === product.value).length;
    const totalSales = orders
      .filter(order => order.selected_edition === product.value)
      .reduce((sum, order) => sum + order.total_amount, 0);
    
    return {
      name: product.name,
      value: product.value,
      salesCount,
      totalSales,
      // For demo purposes, let's create some stock levels
      stockLevel: Math.floor(Math.random() * 50) + 10,
      stockStatus: Math.random() > 0.7 ? 'low' : 'normal'
    };
  }) : [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome to your admin dashboard</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Today's Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders Today</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrdersToday}</div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">COD Orders Today</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full w-10 h-10 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.codOrdersToday}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalOrdersToday > 0 ? Math.round((stats.codOrdersToday / stats.totalOrdersToday) * 100) : 0}% of today's orders
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Orders Today</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full w-10 h-10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.onlineOrdersToday}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalOrdersToday > 0 ? Math.round((stats.onlineOrdersToday / stats.totalOrdersToday) * 100) : 0}% of today's orders
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-full w-10 h-10 flex items-center justify-center">
              <span className="text-purple-500 font-bold text-lg">৳</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">৳{stats.revenueToday.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              From {stats.totalOrdersToday} order{stats.totalOrdersToday !== 1 ? 's' : ''} today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50/30 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alert
            </CardTitle>
            <CardDescription className="text-red-600">
              {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low on stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      item.type === 'product' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {item.type === 'product' ? 
                        <Package className="h-4 w-4 text-blue-600" /> : 
                        <ShoppingBag className="h-4 w-4 text-green-600" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{item.stock}</span>
                    <p className="text-xs text-gray-500">left</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Orders */}
      <Card className="shadow-sm hover:shadow transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Today's Orders</CardTitle>
            <CardDescription>Orders placed today</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs flex items-center gap-1"
            onClick={() => navigate('/admin/orders')}
          >
            View All <ChevronRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {todayOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders placed today yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      order.payment_method === 'cod' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {order.payment_method === 'cod' ? 
                        <Banknote className="h-4 w-4 text-green-600" /> : 
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      }
                    </div>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600">{order.customer_phone}</p>
                        <span className="text-gray-300">|</span>
                        <p className="text-sm text-gray-600">{order.selected_edition} Edition</p>
                        <span className="text-gray-300">|</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.payment_method === 'cod' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {order.payment_method === 'cod' ? 'COD' : 'Online'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.total_amount.toLocaleString()} BDT</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      order.order_status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.order_status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : order.order_status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
