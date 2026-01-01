-- Setup SQL for Bundle Management
-- Run this in Supabase SQL Editor before using bundle features

-- 1. Disable RLS on bundles table
ALTER TABLE public.bundles DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on bundle_items table
ALTER TABLE public.bundle_items DISABLE ROW LEVEL SECURITY;

-- 3. Ensure CASCADE delete is set up (if not already)
-- This ensures bundle_items are deleted when bundle is deleted
ALTER TABLE bundle_items 
DROP CONSTRAINT IF EXISTS bundle_items_bundle_id_fkey;

ALTER TABLE bundle_items
ADD CONSTRAINT bundle_items_bundle_id_fkey
FOREIGN KEY (bundle_id) 
REFERENCES bundles(id) 
ON DELETE CASCADE;

-- 4. Verify RLS status (should show false for both)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('bundles', 'bundle_items');
