-- Add stock_quantity column to products table
ALTER TABLE public.products 
ADD COLUMN stock_quantity integer NOT NULL DEFAULT 0;

-- Add low_stock_threshold column for better stock management
ALTER TABLE public.products 
ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 5;

-- Create index for better performance when filtering by stock
CREATE INDEX idx_products_stock_quantity ON public.products(stock_quantity);

-- Create function to handle stock deduction on order creation
CREATE OR REPLACE FUNCTION public.handle_stock_deduction()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
  product_stock INTEGER;
BEGIN
  -- Only process if order status is being set to 'confirmed' or 'paid'
  IF NEW.status IN ('confirmed', 'paid') AND (OLD.status IS NULL OR OLD.status NOT IN ('confirmed', 'paid')) THEN
    -- Loop through order items and deduct stock
    FOR item_record IN 
      SELECT 
        (item->>'id')::uuid as product_id,
        (item->>'quantity')::integer as quantity
      FROM jsonb_array_elements(NEW.items) as item
    LOOP
      -- Get current stock
      SELECT stock_quantity INTO product_stock
      FROM public.products
      WHERE id = item_record.product_id;
      
      -- Check if enough stock is available
      IF product_stock < item_record.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product ID: %. Available: %, Requested: %', 
          item_record.product_id, product_stock, item_record.quantity;
      END IF;
      
      -- Deduct stock
      UPDATE public.products
      SET 
        stock_quantity = stock_quantity - item_record.quantity,
        updated_at = now()
      WHERE id = item_record.product_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic stock deduction
CREATE TRIGGER trigger_handle_stock_deduction
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_stock_deduction();

-- Create function to restore stock when order is cancelled
CREATE OR REPLACE FUNCTION public.handle_stock_restoration()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
BEGIN
  -- Only process if order status is being set to 'cancelled' from a confirmed/paid status
  IF NEW.status = 'cancelled' AND OLD.status IN ('confirmed', 'paid') THEN
    -- Loop through order items and restore stock
    FOR item_record IN 
      SELECT 
        (item->>'id')::uuid as product_id,
        (item->>'quantity')::integer as quantity
      FROM jsonb_array_elements(NEW.items) as item
    LOOP
      -- Restore stock
      UPDATE public.products
      SET 
        stock_quantity = stock_quantity + item_record.quantity,
        updated_at = now()
      WHERE id = item_record.product_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for stock restoration on cancellation
CREATE TRIGGER trigger_handle_stock_restoration
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_stock_restoration();