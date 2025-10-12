import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export async function updateProductPrice(req, res) {
  try {
    const { id, price } = req.body;
    
    if (!id || typeof price !== 'number') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    
    // Direct SQL update using service role
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ price })
      .eq('id', id)
      .select('price');
    
    if (error) {
      console.error('Error updating product price:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in updateProductPrice:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function updateAccessoryPrice(req, res) {
  try {
    const { id, price } = req.body;
    
    if (!id || typeof price !== 'number') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    
    // Direct SQL update using service role
    const { data, error } = await supabaseAdmin
      .from('accessories')
      .update({ price })
      .eq('id', id)
      .select('price');
    
    if (error) {
      console.error('Error updating accessory price:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in updateAccessoryPrice:', error);
    return res.status(500).json({ error: error.message });
  }
}