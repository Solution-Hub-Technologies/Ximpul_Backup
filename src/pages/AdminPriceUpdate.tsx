import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProducts, useAccessories } from '@/hooks/useProducts';
import { RefreshCw } from 'lucide-react';

export const AdminPriceUpdate = () => {
  const { data: products, refetch: refetchProducts } = useProducts();
  const { data: accessories, refetch: refetchAccessories } = useAccessories();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [selectedAccessory, setSelectedAccessory] = useState('');
  const [accessoryPrice, setAccessoryPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Set price when product selection changes
  useEffect(() => {
    if (selectedProduct) {
      const product = products?.find(p => p.id === selectedProduct);
      if (product) {
        setProductPrice(product.price.toString());
      }
    }
  }, [selectedProduct, products]);
  
  // Set price when accessory selection changes
  useEffect(() => {
    if (selectedAccessory) {
      const accessory = accessories?.find(a => a.id === selectedAccessory);
      if (accessory) {
        setAccessoryPrice(accessory.price.toString());
      }
    }
  }, [selectedAccessory, accessories]);

  const updateProductPrice = async () => {
    if (!selectedProduct || !productPrice) {
      toast.error('Please select a product and enter a price');
      return;
    }

    setIsLoading(true);
    try {
      // Direct Supabase update
      const { error } = await supabase
        .from('products')
        .update({ price: parseFloat(productPrice) })
        .eq('id', selectedProduct);

      if (error) throw error;
      
      toast.success(`Product price updated to ${productPrice}`);
      await refetchProducts();
      
      // Verify the update
      const { data, error: verifyError } = await supabase
        .from('products')
        .select('price')
        .eq('id', selectedProduct)
        .single();
        
      if (verifyError) {
        console.error('Verification error:', verifyError);
      } else {
        console.log('Updated price in database:', data.price);
      }
      
    } catch (error) {
      console.error('Error updating product price:', error);
      toast.error('Failed to update product price: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAccessoryPrice = async () => {
    if (!selectedAccessory || !accessoryPrice) {
      toast.error('Please select an accessory and enter a price');
      return;
    }

    setIsLoading(true);
    try {
      // Direct Supabase update
      const { error } = await supabase
        .from('accessories')
        .update({ price: parseFloat(accessoryPrice) })
        .eq('id', selectedAccessory);

      if (error) throw error;
      
      toast.success(`Accessory price updated to ${accessoryPrice}`);
      await refetchAccessories();
      
      // Verify the update
      const { data, error: verifyError } = await supabase
        .from('accessories')
        .select('price')
        .eq('id', selectedAccessory)
        .single();
        
      if (verifyError) {
        console.error('Verification error:', verifyError);
      } else {
        console.log('Updated price in database:', data.price);
      }
      
    } catch (error) {
      console.error('Error updating accessory price:', error);
      toast.error('Failed to update accessory price: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Price Update Tool</h1>
          <p className="text-gray-500 mt-1">Update product and accessory prices</p>
        </div>
        <Button 
          onClick={() => {
            refetchProducts();
            refetchAccessories();
          }} 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Update Product Price</CardTitle>
          <CardDescription>Select a product and enter a new price</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-select">Select Product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.price} BDT
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-price">New Price</Label>
            <Input 
              id="product-price" 
              type="number" 
              value={productPrice} 
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="Enter new price"
            />
          </div>
          <Button 
            onClick={updateProductPrice} 
            disabled={isLoading || !selectedProduct}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Update Product Price'}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Update Accessory Price</CardTitle>
          <CardDescription>Select an accessory and enter a new price</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessory-select">Select Accessory</Label>
            <Select value={selectedAccessory} onValueChange={setSelectedAccessory}>
              <SelectTrigger>
                <SelectValue placeholder="Select an accessory" />
              </SelectTrigger>
              <SelectContent>
                {accessories?.map(accessory => (
                  <SelectItem key={accessory.id} value={accessory.id}>
                    {accessory.name} - {accessory.price} BDT
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accessory-price">New Price</Label>
            <Input 
              id="accessory-price" 
              type="number" 
              value={accessoryPrice} 
              onChange={(e) => setAccessoryPrice(e.target.value)}
              placeholder="Enter new price"
            />
          </div>
          <Button 
            onClick={updateAccessoryPrice} 
            disabled={isLoading || !selectedAccessory}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Update Accessory Price'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};