-- Update the order ID generation function to start from 100274
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TEXT AS $$
DECLARE
    new_order_id TEXT;
    counter INTEGER;
BEGIN
    -- Start counter from 100275 (so next order will be 100275)
    counter := 100275;
    
    -- Generate order ID as just the number (no ORD- prefix)
    new_order_id := counter::TEXT;
    
    -- Ensure uniqueness by checking existing order_ids
    WHILE EXISTS (SELECT 1 FROM orders WHERE order_id = new_order_id) LOOP
        counter := counter + 1;
        new_order_id := counter::TEXT;
    END LOOP;
    
    RETURN new_order_id;
END;
$$ LANGUAGE plpgsql;