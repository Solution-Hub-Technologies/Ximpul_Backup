
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Edition, Accessory } from '@/types/buySection';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) throw error;
      
      return data.map(product => ({
        id: product.id,
        name: product.name,
        value: product.edition,
        price: product.price,
        description: product.description || '',
        image_url: product.image_url,
        edition: product.edition,
        stock_black: product.stock_black || 0,
        stock_grey: product.stock_grey || 0
      })) as Edition[];
    },
    // Disable caching to always get fresh data
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
};

export const useAccessories = () => {
  return useQuery({
    queryKey: ['accessories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accessories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return data.map(accessory => ({
        id: accessory.id,
        name: accessory.name,
        price: accessory.price,
        note: accessory.note || '',
        stock_black: accessory.stock_black || 0,
        stock_grey: accessory.stock_grey || 0,
        stock_default: accessory.stock_default || 0
      })) as Accessory[];
    },
    // Disable caching to always get fresh data
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
};
