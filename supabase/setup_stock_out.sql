-- Setup SQL for Stock Out (Barang Keluar)
-- Run this in Supabase SQL Editor

-- 1. Create stock_out table
CREATE TABLE IF NOT EXISTS public.stock_out (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    bundle_id BIGINT REFERENCES bundles(id) ON DELETE CASCADE,
    qty INTEGER NOT NULL,
    harga_jual INTEGER NOT NULL,
    biaya_tambahan INTEGER DEFAULT 0,
    total_harga INTEGER NOT NULL,
    keterangan TEXT,
    tanggal TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_product_or_bundle CHECK (
        (product_id IS NOT NULL AND bundle_id IS NULL) OR
        (product_id IS NULL AND bundle_id IS NOT NULL)
    )
);

-- 2. Disable RLS
ALTER TABLE public.stock_out DISABLE ROW LEVEL SECURITY;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_out_product_id ON stock_out(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_bundle_id ON stock_out(bundle_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_tanggal ON stock_out(tanggal);

-- 4. Verify
SELECT * FROM stock_out LIMIT 1;
