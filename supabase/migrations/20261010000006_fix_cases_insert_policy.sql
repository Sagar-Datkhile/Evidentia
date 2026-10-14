-- =============================================================================
-- Migration: 20261010000006_fix_cases_insert_policy.sql
-- Description: Fix RLS violation during case creation.
--              Restricts INSERT on public.cases strictly to admins.
--              Ensures unambiguous column references in the policy.
-- =============================================================================

-- Drop the overly permissive and potentially ambiguous policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Cases insertable by admin or user" ON public.cases;
    DROP POLICY IF EXISTS "Cases insertable by Police Officer or Admin" ON public.cases;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Create the strict admin-only policy with unambiguous column references
CREATE POLICY "Cases insertable by admin" ON public.cases
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );
