
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { toast } from 'sonner';


import { sanitizeForLog } from '@/utils/security';

export interface Order {
  id: string;
  order_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  selected_edition: string;
  selected_color: string;
  selected_accessories: string[];
  engraving_text: string | null;
  payment_method: string;
  payment_status: string;
  payment_transaction_id: string | null;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  order_status: string;
  admin_notes: string | null;
  tracking_number: string | null;
  estimated_delivery: string | null;
  processed_by: string | null;
  processed_at: string | null;
  privacy_preference: boolean;
  created_at: string;
  updated_at: string;
  updated_by_name?: string;
  is_manual_order?: boolean;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching orders from database...');
      
      let allOrders: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: pageData, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) {
          console.error('Error fetching orders:', sanitizeForLog(error?.message || 'Unknown error'));
          throw error;
        }

        if (pageData && pageData.length > 0) {
          allOrders = [...allOrders, ...pageData];
          if (pageData.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      const data = allOrders;
      console.log('Orders fetched successfully:', sanitizeForLog(String(data?.length || 0)), 'orders');
      
      // Fetch admin names for orders with processed_by
      const orderIds = (data || []).filter(o => o.processed_by).map(o => o.processed_by);
      const uniqueAdminIds = [...new Set(orderIds)];
      
      let adminNames: Record<string, string> = {};
      if (uniqueAdminIds.length > 0) {
        const { data: adminData, error: adminErr } = await supabaseAdmin
          .from('admin_users')
          .select('id, name')
          .in('id', uniqueAdminIds);
          
        if (adminErr) {
          console.error('Error fetching admin names:', adminErr);
        }
        
        if (adminData) {
          adminNames = adminData.reduce((acc, admin) => {
            acc[admin.id] = admin.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      const transformedOrders: Order[] = (data || []).map(order => {
        // Check if order was manually created by comparing created_at with processed_at
        // Manual orders have processed_by set at creation time, so created_at should be very close to processed_at
        const createdDate = order.created_at ? new Date(order.created_at).toISOString().slice(0, 19) : null;
        const processedDate = order.processed_at ? new Date(order.processed_at).toISOString().slice(0, 19) : null;
        const isManualOrder = order.processed_by && createdDate && processedDate && createdDate === processedDate;
        
        return {
          ...order,
          selected_accessories: Array.isArray(order.selected_accessories) 
            ? order.selected_accessories as string[]
            : [],
          payment_status: order.payment_status || 'pending',
          customer_email: order.customer_email || null,
          updated_by_name: order.processed_by ? adminNames[order.processed_by] : undefined,
          is_manual_order: isManualOrder
        };
      });
      
      setOrders(transformedOrders);
    } catch (err: any) {
      console.error('Error fetching orders:', sanitizeForLog(err?.message || 'Unknown error'));
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      console.log('Fetching order with ID:', sanitizeForLog(orderId));
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order:', sanitizeForLog(error?.message || 'Unknown error'));
        return null;
      }

      console.log('Raw order data received');
      const transformedOrder = {
        ...data,
        selected_accessories: Array.isArray(data.selected_accessories) 
          ? data.selected_accessories as string[]
          : [],
        payment_status: data.payment_status || 'pending',
        customer_email: data.customer_email || null
      };
      console.log('Order transformed successfully');
      return transformedOrder;
    } catch (err: any) {
      console.error('Error fetching order:', sanitizeForLog(err?.message || 'Unknown error'));
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, adminId: string, notes?: string) => {
    try {
      console.log('Updating order:', { orderId: sanitizeForLog(orderId), newStatus: sanitizeForLog(newStatus), adminId: sanitizeForLog(adminId) });
      
      // Get current order data to check if stock should be deducted or restored
      const currentOrder = orders.find(order => order.id === orderId);
      if (!currentOrder) {
        throw new Error('Order not found');
      }

      // Check if stock should be deducted (COD orders when moving to processing)
      const shouldDeductStock = currentOrder.payment_method === 'cod' && 
                               newStatus === 'processing' && 
                               currentOrder.order_status === 'pending' &&
                               currentOrder.payment_status !== 'completed';

      // Check if stock should be restored (any order cancelled that had stock deducted)
      // For online orders: payment_status = 'completed'
      // For COD orders: order_status = 'processing' or later
      const shouldRestoreStock = newStatus === 'cancelled' && 
                                currentOrder.order_status !== 'cancelled' &&
                                (
                                  // Online orders that were confirmed (stock was deducted)
                                  (currentOrder.payment_method === 'online' && currentOrder.payment_status === 'completed') ||
                                  // COD orders that were processed (stock was deducted)
                                  (currentOrder.payment_method === 'cod' && ['processing', 'shipped', 'delivered'].includes(currentOrder.order_status))
                                );
      
      console.log('Stock restoration check:', {
        newStatus: sanitizeForLog(newStatus),
        paymentMethod: sanitizeForLog(currentOrder.payment_method),
        currentOrderStatus: sanitizeForLog(currentOrder.order_status),
        paymentStatus: sanitizeForLog(currentOrder.payment_status),
        shouldRestoreStock
      });
      
      // Only set processed_at if it doesn't exist (first time processing)
      const updateData: any = {
        order_status: newStatus,
        admin_notes: notes || null,
        updated_at: new Date().toISOString(),
        processed_by: adminId
      };
      
      if (!currentOrder.processed_at) {
        updateData.processed_at = new Date().toISOString();
      }
      
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select();

      console.log('Update result:', { data: sanitizeForLog(JSON.stringify(data)), error: sanitizeForLog(error?.message || 'No error') });
      
      if (error) throw error;

      // Handle stock operations
      if (shouldDeductStock) {
        await deductStockForOrder(currentOrder, `COD order confirmed - Order ID: ${currentOrder.order_id}`);
      } else if (shouldRestoreStock) {
        await restoreStockForOrder(currentOrder);
      }

      // Fetch admin name
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('name')
        .eq('id', adminId)
        .single();

      // Update local state immediately and sort by updated_at
      const now = new Date().toISOString();
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                order_status: newStatus, 
                admin_notes: notes || null,
                updated_at: now,
                processed_by: adminId,
                processed_at: order.processed_at || now,
                updated_by_name: adminData?.name,
                is_manual_order: order.is_manual_order
              }
            : order
        );
        // Update local state immediately keeping order position (sorted by created_at)
        return updatedOrders.sort((a, b) => new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime());
      });
      
      toast.success('Order status updated successfully');
      
    } catch (err: any) {
      console.error('Error updating order:', sanitizeForLog(err?.message || 'Unknown error'));
      toast.error(`Failed to update order status: ${err.message}`);
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string, adminId: string, notes?: string) => {
    try {
      console.log('Updating payment status:', { orderId: sanitizeForLog(orderId), newPaymentStatus: sanitizeForLog(newPaymentStatus), adminId: sanitizeForLog(adminId), notes: sanitizeForLog(notes || '') });
      
      // Get current order data to check if stock should be deducted
      const currentOrder = orders.find(order => order.id === orderId);
      if (!currentOrder) {
        throw new Error('Order not found');
      }

      // Don't deduct stock here for online orders - it's already handled in PaymentSuccess.tsx
      const shouldDeductStock = false;

      // Only set processed_at if it doesn't exist (first time processing)
      const updateData: any = {
        payment_status: newPaymentStatus,
        admin_notes: notes || null,
        updated_at: new Date().toISOString(),
        processed_by: adminId
      };
      
      if (!currentOrder.processed_at) {
        updateData.processed_at = new Date().toISOString();
      }
      
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select();

      if (error) {
        console.error('Error updating payment status:', sanitizeForLog(error?.message || 'Unknown error'));
        throw error;
      }

      console.log('Payment status updated successfully:', sanitizeForLog(JSON.stringify(data)));
      
      // Deduct stock for online orders when payment is confirmed
      if (shouldDeductStock) {
        await deductStockForOrder(currentOrder, `Online payment confirmed - Order ID: ${currentOrder.order_id}`);
      }
      
      // Fetch admin name
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('name')
        .eq('id', adminId)
        .single();
      
      // Update local state immediately and sort by updated_at
      const now = new Date().toISOString();
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, payment_status: newPaymentStatus, admin_notes: notes || null, updated_at: now, processed_by: adminId, processed_at: order.processed_at || now, updated_by_name: adminData?.name, is_manual_order: order.is_manual_order }
            : order
        );
        // Update local state immediately keeping order position (sorted by created_at)
        return updatedOrders.sort((a, b) => new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime());
      });
      
      toast.success('Payment status updated successfully');
      
    } catch (err: any) {
      console.error('Error updating payment status:', sanitizeForLog(err?.message || 'Unknown error'));
      toast.error(`Failed to update payment status: ${err.message}`);
    }
  };

  const updateTrackingInfo = async (orderId: string, trackingNumber: string, estimatedDelivery: string) => {
    try {
      console.log('Updating tracking info:', { orderId: sanitizeForLog(orderId), trackingNumber: sanitizeForLog(trackingNumber), estimatedDelivery: sanitizeForLog(estimatedDelivery) });
      
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber,
          estimated_delivery: estimatedDelivery,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating tracking:', sanitizeForLog(error?.message || 'Unknown error'));
        throw error;
      }
      
      // Update local state immediately and sort by updated_at
      const now = new Date().toISOString();
      setOrders(prevOrders => {
        const updatedOrders = prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, tracking_number: trackingNumber, estimated_delivery: estimatedDelivery, updated_at: now, is_manual_order: order.is_manual_order }
            : order
        );
        // Update local state immediately keeping order position (sorted by created_at)
        return updatedOrders.sort((a, b) => new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime());
      });
      
      toast.success('Tracking information updated');
      
      
      setTimeout(() => {
        fetchOrders();
      }, 100);
      
    } catch (err: any) {
      console.error('Error updating tracking:', sanitizeForLog(err?.message || 'Unknown error'));
      toast.error(`Failed to update tracking information: ${err.message}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      console.log('Deleting order:', sanitizeForLog(orderId));
      
      const { error } = await supabaseAdmin
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Error deleting order:', sanitizeForLog(error?.message || 'Unknown error'));
        throw error;
      }

      console.log('Order deleted successfully');
      
      // Update local state immediately
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      
      toast.success('Order deleted successfully');
      
    } catch (err: any) {
      console.error('Error deleting order:', sanitizeForLog(err?.message || 'Unknown error'));
      toast.error(`Failed to delete order: ${err.message}`);
    }
  };

  const deductStockForOrder = async (order: Order, reason?: string) => {
    try {
      console.log('Deducting stock for order:', sanitizeForLog(String(order.order_id)));
      
      const defaultReason = reason || `Online payment confirmed - Order ID: ${order.order_id}`;
      
      // Deduct product stock
      const { data: productData, error: productError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('edition', order.selected_edition)
        .single();

      if (productError) {
        console.error('Error fetching product:', sanitizeForLog(productError?.message || 'Unknown error'));
        throw productError;
      }

      if (productData) {
        const stockField = order.selected_color === 'obsidian' ? 'stock_black' : 'stock_grey';
        const currentStock = productData[stockField] || 0;

        if (currentStock > 0) {
          // Update product stock
          const { error: updateError } = await supabaseAdmin
            .from('products')
            .update({ [stockField]: currentStock - 1 })
            .eq('edition', order.selected_edition);

          if (updateError) throw updateError;

          // Log stock change
          await supabaseAdmin
            .from('stock_logs')
            .insert({
              item_id: productData.id,
              item_type: 'product',
              item_name: order.selected_edition,
              color: order.selected_color,
              change_amount: -1,
              reason: defaultReason,
              previous_stock: currentStock,
              new_stock: currentStock - 1
            });

          console.log(`Product stock deducted: ${sanitizeForLog(order.selected_edition)} ${sanitizeForLog(order.selected_color)}`);
        }
      }

      // Deduct accessory stock if any accessories are selected
      if (order.selected_accessories && order.selected_accessories.length > 0) {
        for (const accessoryName of order.selected_accessories) {
          const { data: accessoryData, error: accessoryError } = await supabaseAdmin
            .from('accessories')
            .select('*')
            .eq('name', accessoryName)
            .single();

          if (accessoryError) {
            console.error('Error fetching accessory:', accessoryError);
            continue;
          }

          if (accessoryData) {
            let stockField = 'stock_default';
            let currentStock = accessoryData.stock_default || 0;
            
            // Handle color-specific accessories (like Straw Cap)
            if (accessoryName.toLowerCase() === 'straw cap') {
              stockField = order.selected_color === 'obsidian' ? 'stock_black' : 'stock_grey';
              currentStock = accessoryData[stockField] || 0;
            }

            if (currentStock > 0) {
              // Update accessory stock
              const { error: updateError } = await supabaseAdmin
                .from('accessories')
                .update({ [stockField]: currentStock - 1 })
                .eq('name', accessoryName);

              if (updateError) throw updateError;

              // Log stock change
              await supabaseAdmin
                .from('stock_logs')
                .insert({
                  item_id: accessoryData.id,
                  item_type: 'accessory',
                  item_name: accessoryName,
                  color: accessoryName.toLowerCase() === 'straw cap' ? order.selected_color : 'default',
                  change_amount: -1,
                  reason: defaultReason,
                  previous_stock: currentStock,
                  new_stock: currentStock - 1
                });

              console.log(`Accessory stock deducted: ${sanitizeForLog(accessoryName)}`);
            }
          }
        }
      }

      toast.success('Stock deducted successfully');
      
    } catch (err: any) {
      console.error('Error deducting stock:', sanitizeForLog(err?.message || 'Unknown error'));
      toast.error(`Failed to deduct stock: ${err.message}`);
    }
  };

  const restoreStockForOrder = async (order: Order) => {
    try {
      console.log('Restoring stock for cancelled order:', sanitizeForLog(String(order.order_id)));
      
      // Restore product stock
      const { data: productData, error: productError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('edition', order.selected_edition)
        .single();

      if (productError) {
        console.error('Error fetching product:', sanitizeForLog(productError?.message || 'Unknown error'));
        throw productError;
      }

      if (productData) {
        const stockField = order.selected_color === 'obsidian' ? 'stock_black' : 'stock_grey';
        const currentStock = productData[stockField] || 0;

        // Update product stock
        const { error: updateError } = await supabaseAdmin
          .from('products')
          .update({ [stockField]: currentStock + 1 })
          .eq('edition', order.selected_edition);

        if (updateError) throw updateError;

        // Log stock change
        await supabaseAdmin
          .from('stock_logs')
          .insert({
            item_id: productData.id,
            item_type: 'product',
            item_name: order.selected_edition,
            color: order.selected_color,
            change_amount: 1,
            reason: `Order cancelled - Order ID: ${order.order_id}`,
            previous_stock: currentStock,
            new_stock: currentStock + 1
          });

        console.log(`Product stock restored: ${sanitizeForLog(order.selected_edition)} ${sanitizeForLog(order.selected_color)}`);
      }

      // Restore accessory stock if any accessories were selected
      if (order.selected_accessories && order.selected_accessories.length > 0) {
        for (const accessoryName of order.selected_accessories) {
          const { data: accessoryData, error: accessoryError } = await supabaseAdmin
            .from('accessories')
            .select('*')
            .eq('name', accessoryName)
            .single();

          if (accessoryError) {
            console.error('Error fetching accessory:', accessoryError);
            continue;
          }

          if (accessoryData) {
            let stockField = 'stock_default';
            let currentStock = accessoryData.stock_default || 0;
            
            // Handle color-specific accessories (like Straw Cap)
            if (accessoryName.toLowerCase() === 'straw cap') {
              stockField = order.selected_color === 'obsidian' ? 'stock_black' : 'stock_grey';
              currentStock = accessoryData[stockField] || 0;
            }

            // Update accessory stock
            const { error: updateError } = await supabaseAdmin
              .from('accessories')
              .update({ [stockField]: currentStock + 1 })
              .eq('name', accessoryName);

            if (updateError) throw updateError;

            // Log stock change
            await supabaseAdmin
              .from('stock_logs')
              .insert({
                item_id: accessoryData.id,
                item_type: 'accessory',
                item_name: accessoryName,
                color: accessoryName.toLowerCase() === 'straw cap' ? order.selected_color : 'default',
                change_amount: 1,
                reason: `Order cancelled - Order ID: ${order.order_id}`,
                previous_stock: currentStock,
                new_stock: currentStock + 1
              });

            console.log(`Accessory stock restored: ${sanitizeForLog(accessoryName)}`);
          }
        }
      }

      toast.success('Stock restored successfully for cancelled order');
      
    } catch (err: any) {
      console.error('Error restoring stock:', sanitizeForLog(err?.message || 'Unknown error'));
      toast.error(`Failed to restore stock: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);


  return {
    orders,
    isLoading,
    error,
    fetchOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    updateTrackingInfo,
    deleteOrder
  };
};
