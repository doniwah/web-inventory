-- Setup SQL for Activity Logs (existing table)
-- Run this in Supabase SQL Editor

-- 1. Disable RLS on existing activity_logs table
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

-- 2. Create indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- 3. Verify RLS status (should show false)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'activity_logs';

-- 4. Check data
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;
