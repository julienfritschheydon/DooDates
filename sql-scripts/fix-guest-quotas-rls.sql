-- ============================================================================
-- FIX: Enable RLS on guest_quotas
-- Description: Resolves "Policy Exists RLS Disabled" and "RLS Disabled in Public" errors
-- ============================================================================

BEGIN;

-- Enable Row Level Security on the table
ALTER TABLE public.guest_quotas ENABLE ROW LEVEL SECURITY;

COMMIT;
