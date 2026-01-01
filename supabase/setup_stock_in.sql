-- Setup SQL for Stock In (Barang Masuk)
-- Run this in Supabase SQL Editor

-- 1. Disable RLS on stock_in table
ALTER TABLE public.stock_in DISABLE ROW LEVEL SECURITY;

-- 2. Verify table structure (optional)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'stock_in';

-- 3. Verify RLS status (should show false)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'stock_in';
