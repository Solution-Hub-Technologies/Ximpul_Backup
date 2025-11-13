import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { useProducts, useAccessories } from '@/hooks/useProducts';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Package, ShoppingBag, Edit, RefreshCw, Plus, Trash2, History, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export const AdminProducts = () => {
  const { adminUser } = useAdminAuth();
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useProducts();
  const { data: accessories, isLoading: accessoriesLoading, refetch: refetchAccessories } = useAccessories();
  const [activeTab, setActiveTab] = useState('products');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editItem, setEditItem] = useState<{
    id: string;
    name: string;
    price: string;
    description: string;
    stock_black: string;
    stock_grey: string;
    stock_default: string;
    type: 'product' | 'accessory';
  } | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    description: '',
    stock_black: '',
    stock_grey: '',
    stock_default: '',
    edition: '',
    type: 'product' as 'product' | 'accessory'
  });
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, id: string, type: 'product' | 'accessory', name: string}>({open: false, id: '', type: 'product', name: ''});
  const [stockDialog, setStockDialog] = useState<{open: boolean, id: string, type: 'product' | 'accessory', name: string, color: string, currentStock: number}>({open: false, id: '', type: 'product', name: '', color: '', currentStock: 0});
  const [stockAmount, setStockAmount] = useState('');
  const [stockOperation, setStockOperation] = useState<'add' | 'subtract'>('add');
  const [stockReason, setStockReason] = useState('');
  const [stockLogs, setStockLogs] = useState([]);
  const [manualLogs, setManualLogs] = useState([]);
  const [showStockLogs, setShowStockLogs] = useState(false);
  const [showManualLogs, setShowManualLogs] = useState(false);

  // Manual logging function
  const logManualChange = async (actionType, productId, productName, oldValue, newValue, changeAmount = null, reason = '') => {
    try {
      await supabaseAdmin.from('manual_logs').insert({
        user_id: adminUser.id,
        user_email: adminUser.email,
        action_type: actionType,
        product_id: productId,
        product_name: productName,
        old_value: oldValue,
        new_value: newValue,
        change_amount: changeAmount,
        reason: reason
      });
    } catch (error) {
      console.error('Error logging manual change:', error);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchProducts(), refetchAccessories()]);
    toast.success('Data refreshed');
  };

  const editProduct = (product) => {
    setEditItem({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      stock_black: (product.stock_black || 0).toString(),
      stock_grey: (product.stock_grey || 0).toString(),
      stock_default: '0',
      type: 'product'
    });
    setIsEditDialogOpen(true);
  };

  const editAccessory = (accessory) => {
    const hasColors = accessory.name.toLowerCase() === 'straw cap';
    setEditItem({
      id: accessory.id,
      name: accessory.name,
      price: accessory.price.toString(),
      description: accessory.note || '',
      stock_black: hasColors ? (accessory.stock_black || 0).toString() : '0',
      stock_grey: hasColors ? (accessory.stock_grey || 0).toString() : '0',
      stock_default: (accessory.stock_default || 0).toString(),
      type: 'accessory'
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editItem || !adminUser) return;
    
    setIsSubmitting(true);
    
    try {
      const newPrice = parseFloat(editItem.price);
      
      if (isNaN(newPrice)) {
        toast.error('Please enter a valid price');
        setIsSubmitting(false);
        return;
      }
      
      // Get old data for audit log
      let oldData;
      if (editItem.type === 'product') {
        const product = products?.find(p => p.id === editItem.id);
        oldData = { name: product?.name, price: product?.price, description: product?.description };
      } else {
        const accessory = accessories?.find(a => a.id === editItem.id);
        oldData = { name: accessory?.name, price: accessory?.price, description: accessory?.note };
      }
      
      if (editItem.type === 'product') {
        const { error } = await supabaseAdmin
          .from('products')
          .update({ 
            name: editItem.name,
            price: newPrice,
            description: editItem.description
          })
          .eq('id', editItem.id);
          
        if (error) throw error;
        
        // Log changes to both audit logs and manual logs
        const changes = [];
        if (oldData.name !== editItem.name) changes.push({ field: 'name', old: oldData.name, new: editItem.name });
        if (oldData.price !== newPrice) changes.push({ field: 'price', old: oldData.price, new: newPrice });
        if (oldData.description !== editItem.description) changes.push({ field: 'description', old: oldData.description, new: editItem.description });
        
        for (const change of changes) {
          // Existing audit log
          await supabaseAdmin.from('product_audit_logs').insert({
            item_id: editItem.id,
            item_type: 'product',
            item_name: editItem.name,
            action_type: change.field === 'price' ? 'price_change' : 'update',
            field_changed: change.field,
            old_value: String(change.old || ''),
            new_value: String(change.new || ''),
            previous_price: change.field === 'price' ? change.old : null,
            new_price: change.field === 'price' ? change.new : null,
            admin_id: adminUser.id,
            admin_name: adminUser.name,
            admin_email: adminUser.email,
            admin_role: adminUser.role
          });
          
          // Manual log
          await logManualChange(
            change.field === 'price' ? 'PRICE_CHANGE' : 'UPDATE_PRODUCT',
            editItem.id,
            editItem.name,
            String(change.old || ''),
            String(change.new || ''),
            change.field === 'price' ? (change.new - change.old) : null,
            `Manual ${change.field} update`
          );
        }
        
        toast.success('Product updated successfully');
        refetchProducts();
      } else {
        const { error } = await supabaseAdmin
          .from('accessories')
          .update({
            name: editItem.name,
            price: newPrice,
            note: editItem.description
          })
          .eq('id', editItem.id);
          
        if (error) throw error;
        
        // Log changes to both audit logs and manual logs
        const changes = [];
        if (oldData.name !== editItem.name) changes.push({ field: 'name', old: oldData.name, new: editItem.name });
        if (oldData.price !== newPrice) changes.push({ field: 'price', old: oldData.price, new: newPrice });
        if (oldData.description !== editItem.description) changes.push({ field: 'note', old: oldData.description, new: editItem.description });
        
        for (const change of changes) {
          // Existing audit log
          await supabaseAdmin.from('product_audit_logs').insert({
            item_id: editItem.id,
            item_type: 'accessory',
            item_name: editItem.name,
            action_type: change.field === 'price' ? 'price_change' : 'update',
            field_changed: change.field,
            old_value: String(change.old || ''),
            new_value: String(change.new || ''),
            previous_price: change.field === 'price' ? change.old : null,
            new_price: change.field === 'price' ? change.new : null,
            admin_id: adminUser.id,
            admin_name: adminUser.name,
            admin_email: adminUser.email,
            admin_role: adminUser.role
          });
          
          // Manual log
          await logManualChange(
            change.field === 'price' ? 'PRICE_CHANGE' : 'UPDATE_ACCESSORY',
            editItem.id,
            editItem.name,
            String(change.old || ''),
            String(change.new || ''),
            change.field === 'price' ? (change.new - change.old) : null,
            `Manual ${change.field} update`
          );
        }
        
        toast.success('Accessory updated successfully');
        refetchAccessories();
      }
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating:', error);
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdd = async () => {
    if (!newItem.name || !newItem.price || (newItem.type === 'product' && !newItem.edition) || !adminUser) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const price = parseFloat(newItem.price);
      
      if (isNaN(price)) {
        toast.error('Please enter a valid price');
        setIsSubmitting(false);
        return;
      }
      
      if (newItem.type === 'product') {
        const stockBlack = parseInt(newItem.stock_black) || 0;
        const stockGrey = parseInt(newItem.stock_grey) || 0;
        const { data, error } = await supabaseAdmin
          .from('products')
          .insert({ 
            name: newItem.name,
            price: price,
            description: newItem.description,
            edition: newItem.edition,
            stock_black: stockBlack,
            stock_grey: stockGrey
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Log creation
        await supabaseAdmin.from('product_audit_logs').insert({
          item_id: data.id,
          item_type: 'product',
          item_name: newItem.name,
          action_type: 'create',
          new_value: `Price: ${price}, Edition: ${newItem.edition}`,
          new_price: price,
          admin_id: adminUser.id,
          admin_name: adminUser.name,
          admin_email: adminUser.email,
          admin_role: adminUser.role,
          notes: `Initial stock - Black: ${stockBlack}, Grey: ${stockGrey}`
        });
        
        // Manual log for product creation
        await logManualChange(
          'ADD_PRODUCT',
          data.id,
          newItem.name,
          '',
          `Price: ৳${price}, Edition: ${newItem.edition}`,
          null,
          `Created new product with initial stock - Black: ${stockBlack}, Grey: ${stockGrey}`
        );
        
        toast.success('Product added successfully');
        refetchProducts();
      } else {
        const hasColors = newItem.name.toLowerCase() === 'straw cap';
        const insertData: any = {
          name: newItem.name,
          price: price,
          note: newItem.description,
          stock_default: parseInt(newItem.stock_default) || 0
        };
        
        if (hasColors) {
          insertData.stock_black = parseInt(newItem.stock_black) || 0;
          insertData.stock_grey = parseInt(newItem.stock_grey) || 0;
        }
        
        const { data, error } = await supabaseAdmin
          .from('accessories')
          .insert(insertData)
          .select()
          .single();
          
        if (error) throw error;
        
        // Log creation
        await supabaseAdmin.from('product_audit_logs').insert({
          item_id: data.id,
          item_type: 'accessory',
          item_name: newItem.name,
          action_type: 'create',
          new_value: `Price: ${price}`,
          new_price: price,
          admin_id: adminUser.id,
          admin_name: adminUser.name,
          admin_email: adminUser.email,
          admin_role: adminUser.role,
          notes: hasColors ? `Initial stock - Black: ${insertData.stock_black}, Grey: ${insertData.stock_grey}` : `Initial stock: ${insertData.stock_default}`
        });
        
        // Manual log for accessory creation
        await logManualChange(
          'ADD_ACCESSORY',
          data.id,
          newItem.name,
          '',
          `Price: ৳${price}`,
          null,
          hasColors ? `Created new accessory with initial stock - Black: ${insertData.stock_black}, Grey: ${insertData.stock_grey}` : `Created new accessory with initial stock: ${insertData.stock_default}`
        );
        
        toast.success('Accessory added successfully');
        refetchAccessories();
      }
      
      setNewItem({ name: '', price: '', description: '', stock_black: '', stock_grey: '', stock_default: '', edition: '', type: 'product' });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding:', error);
      toast.error(`Failed to add: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!adminUser) return;
    
    try {
      if (deleteDialog.type === 'product') {
        const product = products?.find(p => p.id === deleteDialog.id);
        
        const { error } = await supabaseAdmin
          .from('products')
          .delete()
          .eq('id', deleteDialog.id);
          
        if (error) throw error;
        
        // Log deletion
        await supabaseAdmin.from('product_audit_logs').insert({
          item_id: deleteDialog.id,
          item_type: 'product',
          item_name: deleteDialog.name,
          action_type: 'delete',
          old_value: `Price: ${product?.price}, Edition: ${product?.edition}`,
          previous_price: product?.price,
          admin_id: adminUser.id,
          admin_name: adminUser.name,
          admin_email: adminUser.email,
          admin_role: adminUser.role,
          notes: `Deleted product with stock - Black: ${product?.stock_black}, Grey: ${product?.stock_grey}`
        });
        
        // Manual log for product deletion
        await logManualChange(
          'REMOVE_PRODUCT',
          deleteDialog.id,
          deleteDialog.name,
          `Price: ৳${product?.price}, Edition: ${product?.edition}`,
          '',
          null,
          `Deleted product with remaining stock - Black: ${product?.stock_black}, Grey: ${product?.stock_grey}`
        );
        
        toast.success('Product deleted successfully');
        refetchProducts();
      } else {
        const accessory = accessories?.find(a => a.id === deleteDialog.id);
        
        const { error } = await supabaseAdmin
          .from('accessories')
          .delete()
          .eq('id', deleteDialog.id);
          
        if (error) throw error;
        
        // Log deletion
        await supabaseAdmin.from('product_audit_logs').insert({
          item_id: deleteDialog.id,
          item_type: 'accessory',
          item_name: deleteDialog.name,
          action_type: 'delete',
          old_value: `Price: ${accessory?.price}`,
          previous_price: accessory?.price,
          admin_id: adminUser.id,
          admin_name: adminUser.name,
          admin_email: adminUser.email,
          admin_role: adminUser.role,
          notes: `Deleted accessory with stock - Default: ${accessory?.stock_default}, Black: ${accessory?.stock_black}, Grey: ${accessory?.stock_grey}`
        });
        
        // Manual log for accessory deletion
        await logManualChange(
          'REMOVE_ACCESSORY',
          deleteDialog.id,
          deleteDialog.name,
          `Price: ৳${accessory?.price}`,
          '',
          null,
          `Deleted accessory with remaining stock - Default: ${accessory?.stock_default}, Black: ${accessory?.stock_black}, Grey: ${accessory?.stock_grey}`
        );
        
        toast.success('Accessory deleted successfully');
        refetchAccessories();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`Failed to delete: ${error.message}`);
    }
    setDeleteDialog({open: false, id: '', type: 'product', name: ''});
  };

  const openAddDialog = (type: 'product' | 'accessory') => {
    setNewItem({ ...newItem, type });
    setIsAddDialogOpen(true);
  };

  const openStockDialog = (id: string, type: 'product' | 'accessory', color: 'black' | 'grey' | 'default') => {
    let item, currentStock, itemName;
    
    if (type === 'product') {
      item = products?.find(p => p.id === id);
      itemName = item?.name || '';
      currentStock = color === 'black' ? (item?.stock_black || 0) : (item?.stock_grey || 0);
    } else {
      item = accessories?.find(a => a.id === id);
      itemName = item?.name || '';
      if (color === 'black') currentStock = item?.stock_black || 0;
      else if (color === 'grey') currentStock = item?.stock_grey || 0;
      else currentStock = item?.stock_default || 0;
    }
    
    setStockDialog({
      open: true,
      id,
      type,
      name: itemName,
      color,
      currentStock
    });
    setStockAmount('');
    setStockOperation('add');
    setStockReason('');
  };

  const confirmStockUpdate = async () => {
    if (!stockAmount || parseInt(stockAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    try {
      const { id, type, name, color, currentStock } = stockDialog;
      const amount = parseInt(stockAmount);
      const change = stockOperation === 'add' ? amount : -amount;
      const newStock = Math.max(0, currentStock + change);
      
      if (type === 'product') {
        const updateField = color === 'black' ? 'stock_black' : 'stock_grey';
        const { error } = await supabaseAdmin
          .from('products')
          .update({ [updateField]: newStock })
          .eq('id', id);
          
        if (error) throw error;
      } else {
        let updateField = '';
        if (color === 'black') updateField = 'stock_black';
        else if (color === 'grey') updateField = 'stock_grey';
        else updateField = 'stock_default';
        
        const { error } = await supabaseAdmin
          .from('accessories')
          .update({ [updateField]: newStock })
          .eq('id', id);
          
        if (error) throw error;
      }
      
      // Get item price
      let itemPrice = 0;
      if (type === 'product') {
        const product = products?.find(p => p.id === id);
        itemPrice = product?.price || 0;
      } else {
        const accessory = accessories?.find(a => a.id === id);
        itemPrice = accessory?.price || 0;
      }
      
      // Log the stock change in stock_logs
      const { error: logError } = await supabaseAdmin
        .from('stock_logs')
        .insert({
          item_id: id,
          item_type: type,
          item_name: name,
          color: color === 'default' ? 'default' : color,
          change_amount: change,
          previous_stock: currentStock,
          new_stock: newStock,
          reason: stockReason || `Stock ${stockOperation === 'add' ? 'added' : 'removed'}`,
          changed_by: adminUser?.id,
          changed_by_name: adminUser?.name,
          item_price: itemPrice
        });
        
      if (logError) console.error('Failed to log stock change:', logError);
      
      // Log in product_audit_logs for comprehensive audit trail
      await supabaseAdmin.from('product_audit_logs').insert({
        item_id: id,
        item_type: type,
        item_name: name,
        action_type: stockOperation === 'add' ? 'stock_add' : 'stock_remove',
        color: color === 'default' ? 'default' : color,
        stock_change: change,
        previous_stock: currentStock,
        new_stock: newStock,
        admin_id: adminUser.id,
        admin_name: adminUser.name,
        admin_email: adminUser.email,
        admin_role: adminUser.role,
        reason: stockReason || `Manual stock ${stockOperation === 'add' ? 'addition' : 'removal'}`,
        notes: `${color.toUpperCase()} - Changed from ${currentStock} to ${newStock} (${change > 0 ? '+' : ''}${change})`
      });
      
      // Manual log for tracking user activities
      await logManualChange(
        stockOperation === 'add' ? 'ADD_QUANTITY' : 'REMOVE_QUANTITY',
        id,
        name,
        currentStock.toString(),
        newStock.toString(),
        change,
        stockReason || `Manual stock ${stockOperation === 'add' ? 'addition' : 'removal'} - ${color.toUpperCase()}`
      );
      
      if (type === 'product') refetchProducts();
      else refetchAccessories();
      
      toast.success(`Stock updated: ${color} ${newStock}`);
      setStockDialog({open: false, id: '', type: 'product', name: '', color: '', currentStock: 0});
      fetchStockLogs();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const fetchStockLogs = async () => {
    try {
      console.log('Fetching stock logs...');
      const { data, error } = await supabaseAdmin
        .from('stock_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      const logsWithNames = await Promise.all((data || []).map(async (log) => {
        if (!log.changed_by_name && log.changed_by) {
          const { data: adminData } = await supabaseAdmin
            .from('admin_users')
            .select('name')
            .eq('id', log.changed_by)
            .single();
          return { ...log, changed_by_name: adminData?.name || 'System' };
        }
        return log;
      }));
      
      setStockLogs(logsWithNames || []);
    } catch (error) {
      console.error('Error fetching stock logs:', error);
      toast.error('Failed to fetch stock logs');
    }
  };

  const fetchManualLogs = async () => {
    try {
      console.log('Fetching manual logs...');
      const { data, error } = await supabaseAdmin
        .from('manual_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      // Fetch admin names for logs
      const logsWithNames = await Promise.all((data || []).map(async (log) => {
        if (log.user_id) {
          const { data: adminData } = await supabaseAdmin
            .from('admin_users')
            .select('name')
            .eq('id', log.user_id)
            .single();
          return { ...log, user_name: adminData?.name || log.user_email };
        }
        return { ...log, user_name: log.user_email };
      }));
      
      console.log('Manual logs fetched:', logsWithNames?.length || 0, 'entries');
      setManualLogs(logsWithNames || []);
    } catch (error) {
      console.error('Error fetching manual logs:', error);
      toast.error('Failed to fetch manual logs');
    }
  };

  useEffect(() => {
    if (showStockLogs) {
      fetchStockLogs();
    }
  }, [showStockLogs]);

  useEffect(() => {
    if (showManualLogs) {
      fetchManualLogs();
    }
  }, [showManualLogs]);

  // Auto-refresh data every 30 seconds to show real-time stock updates from website orders
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing product data for real-time stock updates...');
      refetchProducts();
      refetchAccessories();
      if (showStockLogs) {
        fetchStockLogs();
      }
      if (showManualLogs) {
        fetchManualLogs();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetchProducts, refetchAccessories, showStockLogs, showManualLogs]);

  if (productsLoading || accessoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-lg font-medium">Loading...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2"></h1>
              <p className="text-gray-600">Manage your products, accessories, and inventory efficiently</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-medium">Auto-refresh: ON</span>
              </div>
              <Button 
                onClick={() => {
                  const newShowStockLogs = !showStockLogs;
                  setShowStockLogs(newShowStockLogs);
                  if (newShowStockLogs) {
                    fetchStockLogs();
                  }
                }} 
                variant={showStockLogs ? "default" : "outline"}
                className="flex items-center gap-2 h-10 px-4 border-gray-300"
              >
                <History className="h-4 w-4" />
                {showStockLogs ? 'Hide' : 'Show'} Stock Logs
              </Button>
              <Button 
                onClick={() => {
                  const newShowManualLogs = !showManualLogs;
                  setShowManualLogs(newShowManualLogs);
                  if (newShowManualLogs) {
                    fetchManualLogs();
                  }
                }} 
                variant={showManualLogs ? "default" : "outline"}
                className="flex items-center gap-2 h-10 px-4 border-gray-300"
              >
                <BarChart3 className="h-4 w-4" />
                {showManualLogs ? 'Hide' : 'Show'} Manual Logs
              </Button>
            </div>
          </div>
        </div>

        {/* Manual Logs Section */}
        {showManualLogs && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Manual Activity Logs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Old Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">New Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Change</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Reason</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {manualLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        No manual activities recorded yet
                      </td>
                    </tr>
                  ) : (
                    manualLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.action_type.includes('ADD') ? 'bg-green-100 text-green-800' :
                            log.action_type.includes('REMOVE') ? 'bg-red-100 text-red-800' :
                            log.action_type.includes('PRICE') ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.action_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{log.product_name}</td>
                        <td className="py-3 px-4 text-gray-600">{log.old_value || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{log.new_value || '-'}</td>
                        <td className="py-3 px-4">
                          {log.change_amount && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              log.change_amount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.change_amount > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{log.reason}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                            {log.user_name || log.user_email}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(log.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stock Logs Section */}
        {showStockLogs && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Stock Changes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Color</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Change</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Reason</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Changed By</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500">
                        No stock changes recorded yet
                      </td>
                    </tr>
                  ) : (
                    stockLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{log.item_name}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {log.item_type === 'product' ? 'Product' : 'Accessory'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">৳{log.item_price?.toLocaleString() || 0}</td>
                        <td className="py-3 px-4">
                          <div 
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor: (log.color?.toLowerCase() === 'black' || log.color?.toLowerCase() === 'obsidian') ? '#000000' : 
                                             (log.color?.toLowerCase() === 'grey' || log.color?.toLowerCase() === 'gray' || log.color?.toLowerCase() === 'graphite') ? '#6b7280' : 
                                             '#3b82f6',
                              border: `1px solid ${(log.color?.toLowerCase() === 'black' || log.color?.toLowerCase() === 'obsidian') ? '#374151' : 
                                                   (log.color?.toLowerCase() === 'grey' || log.color?.toLowerCase() === 'gray' || log.color?.toLowerCase() === 'graphite') ? '#9ca3af' : 
                                                   '#60a5fa'}`
                            }}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              log.color === 'black' || log.color === 'grey' ? 'bg-white' : 'bg-white'
                            }`}></div>
                            {log.color === 'grey' ? 'GRAPHITE' : log.color === 'black' ? 'OBSIDIAN' : log.color.toUpperCase()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            log.change_amount > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.change_amount > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-600">{log.previous_stock}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium">{log.new_stock}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{log.reason}</td>
                        <td className="py-3 px-4">
                          {log.changed_by_name ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                              {log.changed_by_name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                              System ({log.reason?.includes('COD') ? 'COD' : log.reason?.includes('Online') ? 'Online' : 'Order'})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(log.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-[400px] bg-white border border-gray-200">
            <TabsTrigger value="products" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">Products</TabsTrigger>
            <TabsTrigger value="accessories" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">Accessories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="mt-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                    <p className="text-sm text-gray-600 mt-1">{products?.length || 0} products available</p>
                  </div>

                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {products?.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products?.map((product) => {
                        // Get product edition image
                        const getProductImage = (edition: string) => {
                          return edition === 'base' 
                            ? '/ximpul-uploads/76e638c0-1db2-4fca-96f9-1e2e3b30e36b.png'
                            : '/ximpul-uploads/88d45bfe-e1d3-4b43-9e01-c85b09d04533.png';
                        };
                        
                        return (
                        <div key={product.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow h-full flex flex-col">
                          <div className="p-6 border-b border-gray-100 flex-1">
                            <div className="flex justify-between items-start h-full">
                              <div className="flex items-start gap-4 flex-1">
                                {/* Product Image */}
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <img 
                                    src={getProductImage(product.edition)}
                                    alt={`${product.name} - ${product.edition} edition`} 
                                    className="w-full h-full object-contain rounded-lg" 
                                    onError={(e) => {
                                      e.currentTarget.src = '/ximpul-uploads/6d7045cd-df5f-4044-81b4-5e7493e56c76.png';
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-h-0">
                                  <h3 className="font-semibold text-xl text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                                  <p className="text-2xl font-bold text-primary mb-1">৳{product.price.toLocaleString()}</p>
                                  <p className="text-sm text-gray-500 mb-2">Edition: {product.edition}</p>
                                  {product.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => editProduct(product)}
                                className="border-gray-300 hover:bg-gray-50 ml-4 flex-shrink-0"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                              </Button>
                            </div>
                          </div>
                          
                          <div className="p-6 bg-gray-50">
                            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Stock Management
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-2">Black Color</p>
                                <div className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => openStockDialog(product.id, 'product', 'black')}>
                                  <div className="w-3 h-3 bg-white rounded-full"></div>
                                  <span className="text-sm font-bold">{product.stock_black || 0}</span>
                                  <Edit className="h-3 w-3" />
                                </div>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-2">Grey Color</p>
                                <div className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-full cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => openStockDialog(product.id, 'product', 'grey')}>
                                  <div className="w-3 h-3 bg-white rounded-full"></div>
                                  <span className="text-sm font-bold">{product.stock_grey || 0}</span>
                                  <Edit className="h-3 w-3" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="accessories" className="mt-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Accessories</h3>
                    <p className="text-sm text-gray-600 mt-1">{accessories?.length || 0} accessories available</p>
                  </div>

                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {accessories?.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">No accessories found</h3>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {accessories?.filter(accessory => 
                        !['Silicone Sleeve', 'Standard Cap'].includes(accessory.name)
                      ).map((accessory) => {
                        // Map accessory names to their specific images
                        const getAccessoryImage = (accessoryName: string) => {
                          const imageMap: { [key: string]: string } = {
                            'Carabiner Hook': '/ximpul-uploads/5ab211c1-9638-4224-9a53-0c8e660bc9be.png',
                            'Aluminium Hook': '/ximpul-uploads/5ab211c1-9638-4224-9a53-0c8e660bc9be.png',
                            'Bottle Brush': '/ximpul-uploads/4315376a-ff14-4683-84d6-b03c96f689d0.png',
                            'Cleaning Brush': '/ximpul-uploads/4315376a-ff14-4683-84d6-b03c96f689d0.png',
                            'Steel Straw Set': '/ximpul-uploads/a09450ea-b274-4a61-ab28-d9f053a0d789.png',
                            'Straw Cap': '/ximpul-uploads/f260e012-e3be-4c1c-8b71-1d2d98fbc29f.png',
                            'Grip Sleeve': '/ximpul-uploads/5db54c96-cade-47a7-abd9-6d68ec608f3c.png',
                            'Silicone Sleeve': '/ximpul-uploads/5db54c96-cade-47a7-abd9-6d68ec608f3c.png',
                            'Premium Cap': '/ximpul-uploads/f083954e-29e0-4720-a050-e8d9f88e5192.png',
                            'Standard Cap': '/ximpul-uploads/f083954e-29e0-4720-a050-e8d9f88e5192.png',
                            'Hydration Lid': '/ximpul-uploads/f260e012-e3be-4c1c-8b71-1d2d98fbc29f.png',
                            'Straw Cleaning Brush': '/ximpul-uploads/a09450ea-b274-4a61-ab28-d9f053a0d789.png'
                          };
                          return imageMap[accessoryName] || '/ximpul-uploads/6d7045cd-df5f-4044-81b4-5e7493e56c76.png';
                        };
                        
                        return (
                        <div key={accessory.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow h-full flex flex-col">
                          <div className="p-6 border-b border-gray-100 flex-1">
                            <div className="flex justify-between items-start h-full">
                              <div className="flex items-start gap-4 flex-1">
                                {/* Accessory Image */}
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <img 
                                    src={getAccessoryImage(accessory.name)}
                                    alt={accessory.name} 
                                    className="w-full h-full object-contain rounded-lg" 
                                    onError={(e) => {
                                      e.currentTarget.src = '/ximpul-uploads/6d7045cd-df5f-4044-81b4-5e7493e56c76.png';
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-h-0">
                                  <h3 className="font-semibold text-xl text-gray-900 mb-2 line-clamp-2">{accessory.name}</h3>
                                  <p className="text-2xl font-bold text-primary mb-1">৳{accessory.price.toLocaleString()}</p>
                                  {accessory.note && (
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{accessory.note}</p>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => editAccessory(accessory)}
                                className="border-gray-300 hover:bg-gray-50 ml-4 flex-shrink-0"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                              </Button>
                            </div>
                          </div>
                          
                          <div className="p-6 bg-gray-50">
                            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Stock Management
                            </h4>
                            {accessory.name.toLowerCase() === 'straw cap' ? (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 mb-2">OBSIDIAN</p>
                                  <div className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-full cursor-pointer hover:bg-gray-800 transition-colors" onClick={() => openStockDialog(accessory.id, 'accessory', 'black')}>
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                    <span className="text-sm font-bold">{accessory.stock_black || 0}</span>
                                    <Edit className="h-3 w-3" />
                                  </div>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 mb-2">GRAPHITE</p>
                                  <div className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-full cursor-pointer hover:bg-gray-600 transition-colors" onClick={() => openStockDialog(accessory.id, 'accessory', 'grey')}>
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                    <span className="text-sm font-bold">{accessory.stock_grey || 0}</span>
                                    <Edit className="h-3 w-3" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-2">Default Stock</p>
                                <div className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors" onClick={() => openStockDialog(accessory.id, 'accessory', 'default')}>
                                  <Package className="h-3 w-3" />
                                  <span className="text-sm font-bold">{accessory.stock_default || 0}</span>
                                  <Edit className="h-3 w-3" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit {editItem?.type === 'product' ? 'Product' : 'Accessory'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {editItem && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editItem.name}
                      onChange={(e) => setEditItem({...editItem, name: e.target.value})}
                      placeholder="Enter name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (৳)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={editItem.price}
                      onChange={(e) => setEditItem({...editItem, price: e.target.value})}
                      placeholder="Enter price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{editItem.type === 'product' ? 'Description' : 'Note'}</Label>
                    <Input
                      id="description"
                      value={editItem.description}
                      onChange={(e) => setEditItem({...editItem, description: e.target.value})}
                      placeholder={`Enter ${editItem.type === 'product' ? 'description' : 'note'}`}
                    />
                  </div>

                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New {newItem.type === 'product' ? 'Product' : 'Accessory'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newName">Name *</Label>
                  <Input
                    id="newName"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPrice">Price (৳) *</Label>
                  <Input
                    id="newPrice"
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    placeholder="Enter price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newDescription">{newItem.type === 'product' ? 'Description' : 'Note'}</Label>
                  <Input
                    id="newDescription"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder={`Enter ${newItem.type === 'product' ? 'description' : 'note'}`}
                  />
                </div>
                {newItem.type === 'product' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newEdition">Edition *</Label>
                      <Input
                        id="newEdition"
                        value={newItem.edition}
                        onChange={(e) => setNewItem({...newItem, edition: e.target.value})}
                        placeholder="Enter edition (e.g., base, lifestyle)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newStockBlack">Black Stock</Label>
                      <Input
                        id="newStockBlack"
                        type="number"
                        value={newItem.stock_black}
                        onChange={(e) => setNewItem({...newItem, stock_black: e.target.value})}
                        placeholder="Enter black stock"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newStockGrey">Grey Stock</Label>
                      <Input
                        id="newStockGrey"
                        type="number"
                        value={newItem.stock_grey}
                        onChange={(e) => setNewItem({...newItem, stock_grey: e.target.value})}
                        placeholder="Enter grey stock"
                      />
                    </div>
                  </>
                )}
                {newItem.type === 'accessory' && (
                  <>
                    {newItem.name.toLowerCase() === 'straw cap' ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="newStockBlack">Black Stock</Label>
                          <Input
                            id="newStockBlack"
                            type="number"
                            value={newItem.stock_black}
                            onChange={(e) => setNewItem({...newItem, stock_black: e.target.value})}
                            placeholder="Enter black stock"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newStockGrey">Grey Stock</Label>
                          <Input
                            id="newStockGrey"
                            type="number"
                            value={newItem.stock_grey}
                            onChange={(e) => setNewItem({...newItem, stock_grey: e.target.value})}
                            placeholder="Enter grey stock"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="newStockDefault">Stock Quantity</Label>
                        <Input
                          id="newStockDefault"
                          type="number"
                          value={newItem.stock_default}
                          onChange={(e) => setNewItem({...newItem, stock_default: e.target.value})}
                          placeholder="Enter stock quantity"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({...deleteDialog, open})}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete {deleteDialog.type === 'product' ? 'Product' : 'Accessory'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                Are you sure you want to delete <strong>"{deleteDialog.name}"</strong>?
                <br /><br />
                This action cannot be undone and will permanently remove this {deleteDialog.type} from your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Stock Update Dialog */}
        <Dialog open={stockDialog.open} onOpenChange={(open) => !open && setStockDialog({open: false, id: '', type: 'product', name: '', color: '', currentStock: 0})}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Update Stock
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{stockDialog.name}</h3>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    stockDialog.color === 'black' ? 'bg-black text-white' :
                    stockDialog.color === 'grey' ? 'bg-gray-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      stockDialog.color === 'black' || stockDialog.color === 'grey' ? 'bg-white' : 'bg-white'
                    }`}></div>
                    {stockDialog.color === 'default' ? 'DEFAULT' : stockDialog.color === 'grey' ? 'GRAPHITE' : stockDialog.color === 'black' ? 'OBSIDIAN' : stockDialog.color.toUpperCase()}
                  </div>
                </div>
                <p className="text-2xl font-bold text-primary">Current Stock: {stockDialog.currentStock}</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Operation</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={stockOperation === 'add' ? 'default' : 'outline'}
                      onClick={() => setStockOperation('add')}
                      className="flex items-center gap-2"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Add Stock
                    </Button>
                    <Button
                      variant={stockOperation === 'subtract' ? 'default' : 'outline'}
                      onClick={() => setStockOperation('subtract')}
                      className="flex items-center gap-2"
                    >
                      <TrendingDown className="h-4 w-4" />
                      Remove Stock
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stockAmount">Amount *</Label>
                  <Input
                    id="stockAmount"
                    type="number"
                    min="1"
                    value={stockAmount}
                    onChange={(e) => setStockAmount(e.target.value)}
                    placeholder="Enter amount to add/remove"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stockReason">Reason (Optional)</Label>
                  <Input
                    id="stockReason"
                    value={stockReason}
                    onChange={(e) => setStockReason(e.target.value)}
                    placeholder="Enter reason for stock change..."
                  />
                </div>
                
                {stockAmount && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Preview: {stockDialog.currentStock} → {Math.max(0, stockDialog.currentStock + (stockOperation === 'add' ? parseInt(stockAmount) || 0 : -(parseInt(stockAmount) || 0)))}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStockDialog({open: false, id: '', type: 'product', name: '', color: '', currentStock: 0})}>
                Cancel
              </Button>
              <Button onClick={confirmStockUpdate} disabled={!stockAmount || parseInt(stockAmount) <= 0}>
                {stockOperation === 'add' ? 'Add' : 'Remove'} Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};