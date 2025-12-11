import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';

export interface BulkOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_location: string;
  products: Array<{
    model: string;
    color: string;
    quantity: string;
    accessories: Array<{ name: string; quantity: number }>;
  }>;
  timeline: string | null;
  engraving: string | null;
  additional_message: string | null;
  status: string;
  last_edited_by: string | null;
  last_edited_at: string | null;
  delivered_by: string | null;
  delivered_at: string | null;
  created_at: string;
}

export const useBulkOrders = () => {
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBulkOrders = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('bulk_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBulkOrders(data || []);
    } catch (error) {
      console.error('Error fetching bulk orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBulkOrder = async (id: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('bulk_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBulkOrders();
      return true;
    } catch (error) {
      console.error('Error deleting bulk order:', error);
      return false;
    }
  };

  const updateBulkOrderStatus = async (id: string, status: string, adminName?: string) => {
    try {
      const updateData: any = { status };
      if (status === 'delivered' && adminName) {
        updateData.delivered_by = adminName;
        updateData.delivered_at = new Date().toISOString();
      }
      
      const { error } = await supabaseAdmin
        .from('bulk_orders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await fetchBulkOrders();
      return true;
    } catch (error) {
      console.error('Error updating bulk order status:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchBulkOrders();
  }, []);

  return { bulkOrders, isLoading, fetchBulkOrders, deleteBulkOrder, updateBulkOrderStatus };
};
