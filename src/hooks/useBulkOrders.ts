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

  useEffect(() => {
    fetchBulkOrders();
  }, []);

  return { bulkOrders, isLoading, fetchBulkOrders };
};
