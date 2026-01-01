-- Migration: Add Tiered Pricing Support
-- Run this in Supabase SQL Editor to add multiple price columns per unit

-- 1. Add new price columns for Dus and Pack
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS harga_beli_dus INTEGER,
ADD COLUMN IF NOT EXISTS harga_jual_dus INTEGER,
ADD COLUMN IF NOT EXISTS harga_beli_pack INTEGER,
ADD COLUMN IF NOT EXISTS harga_jual_pack INTEGER;

-- 2. Rename existing price columns to indicate they are for Pcs
-- Note: We'll keep the old column names for backward compatibility
-- and add comments to clarify
COMMENT ON COLUMN products.harga_beli IS 'Harga beli per Pcs (base unit)';
COMMENT ON COLUMN products.harga_jual IS 'Harga jual per Pcs (base unit)';

-- 3. Add unit tracking to stock_in table
ALTER TABLE stock_in 
ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'pcs';

COMMENT ON COLUMN stock_in.unit IS 'Unit yang digunakan saat transaksi: dus, pack, atau pcs';

-- 4. Add unit tracking to stock_out table
ALTER TABLE stock_out 
ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'pcs';

COMMENT ON COLUMN stock_out.unit IS 'Unit yang digunakan saat transaksi: dus, pack, atau pcs';

-- 5. Add price tracking columns to stock_in (untuk audit trail)
ALTER TABLE stock_in
ADD COLUMN IF NOT EXISTS harga_beli_per_unit INTEGER;

COMMENT ON COLUMN stock_in.harga_beli_per_unit IS 'Harga beli per unit yang digunakan saat transaksi';

-- 6. Add price tracking columns to stock_out (untuk audit trail)
ALTER TABLE stock_out
ADD COLUMN IF NOT EXISTS harga_jual_per_unit INTEGER;

COMMENT ON COLUMN stock_out.harga_jual_per_unit IS 'Harga jual per unit yang digunakan saat transaksi';

-- 7. Verify the changes
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products' 
    AND column_name LIKE '%harga%'
ORDER BY ordinal_position;

SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('stock_in', 'stock_out')
    AND column_name IN ('unit', 'harga_beli_per_unit', 'harga_jual_per_unit')
ORDER BY table_name, ordinal_position;
