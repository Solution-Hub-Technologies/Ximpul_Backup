-- Create a function to update product price
CREATE OR REPLACE FUNCTION update_product_price(product_id UUID, new_price NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET price = new_price, updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update accessory price
CREATE OR REPLACE FUNCTION update_accessory_price(accessory_id UUID, new_price NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE accessories 
  SET price = new_price, updated_at = NOW()
  WHERE id = accessory_id;
END;
$$ LANGUAGE plpgsql;