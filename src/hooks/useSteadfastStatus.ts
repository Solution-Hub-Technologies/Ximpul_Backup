import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';

interface SteadfastStatus {
  tracking_number: string;
  delivery_status: string;
  current_location?: string;
  estimated_delivery?: string;
  last_updated?: string;
  loading: boolean;
  error?: string;
}

export const useSteadfastStatus = (trackingNumbers: string[]) => {
  const [statuses, setStatuses] = useState<Record<string, SteadfastStatus>>({});

  const fetchStatus = async (trackingNumber: string) => {
    if (!trackingNumber) return;

    setStatuses(prev => ({
      ...prev,
      [trackingNumber]: { ...prev[trackingNumber], loading: true, tracking_number: trackingNumber }
    }));

    try {
      // Get Steadfast credentials
      const { data: vendors } = await supabaseAdmin
        .from('courier_vendors')
        .select('*')
        .eq('type', 'steadfast')
        .eq('status', 'active')
        .limit(1);

      if (!vendors || vendors.length === 0) {
        throw new Error('No active Steadfast vendor');
      }

      const vendor = vendors[0];
      const apiUrl = vendor.base_url.endsWith('/') 
        ? `${vendor.base_url}status_by_cid/${trackingNumber}`
        : `${vendor.base_url}/status_by_cid/${trackingNumber}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Api-Key': vendor.api_key,
          'Secret-Key': vendor.secret_key,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('Steadfast API Response for', trackingNumber, ':', result);

      if (result.status === 200) {
        // Handle different response formats from Steadfast API
        let deliveryStatus = result.delivery_status || 
                            result.current_status || 
                            result.status_name || 
                            (result.consignment && result.consignment.delivery_status) ||
                            'unknown';
        
        // Normalize status to match our config
        deliveryStatus = deliveryStatus.toString().toLowerCase().trim().replace(/\s+/g, '_');
        
        const location = result.current_location || 
                        result.hub || 
                        (result.consignment && result.consignment.current_location) || 
                        '';

        // Update order status based on Steadfast status
        let newOrderStatus = null;
        if (deliveryStatus === 'approval_pending' || deliveryStatus === 'delivered_approval_pending' || deliveryStatus === 'out_for_delivery' || deliveryStatus === 'in_transit') {
          newOrderStatus = 'shipped';
        } else if (deliveryStatus === 'delivered' || deliveryStatus === 'delivered_&_paid' || deliveryStatus === 'partial_delivered' || deliveryStatus === 'partly_delivered') {
          newOrderStatus = 'delivered';
        } else if (deliveryStatus === 'cancelled' || deliveryStatus === 'canceled') {
          newOrderStatus = 'cancelled';
        } else if (deliveryStatus === 'returned' || deliveryStatus === 'return_in_transit') {
          newOrderStatus = 'cancelled';
        }

        if (newOrderStatus) {
          supabaseAdmin
            .from('orders')
            .update({ order_status: newOrderStatus })
            .eq('tracking_number', trackingNumber)
            .then(() => console.log('Order status updated to:', newOrderStatus))
            .catch(err => console.error('Failed to update order status:', err));
        }

        setStatuses(prev => ({
          ...prev,
          [trackingNumber]: {
            tracking_number: trackingNumber,
            delivery_status: deliveryStatus,
            current_location: location,
            estimated_delivery: result.estimated_delivery,
            last_updated: new Date().toISOString(),
            loading: false
          }
        }));
      } else {
        throw new Error(result.message || 'Failed to fetch status');
      }
    } catch (error: any) {
      console.error('Steadfast API Error for', trackingNumber, ':', error);
      setStatuses(prev => ({
        ...prev,
        [trackingNumber]: {
          tracking_number: trackingNumber,
          delivery_status: 'unknown',
          loading: false,
          error: error.message
        }
      }));
    }
  };

  const refreshStatus = (trackingNumber: string) => {
    fetchStatus(trackingNumber);
  };

  useEffect(() => {
    trackingNumbers.forEach(tn => {
      if (tn && !statuses[tn]) {
        fetchStatus(tn);
      }
    });
  }, [trackingNumbers.join(',')]);

  return { statuses, refreshStatus };
};
