-- =============================================================================
-- Migration: 20261010000006_fix_cases_insert_rls.sql
-- Description: Fix RLS violation during case creation by updating legacy policies.
--              Drops old policies that referenced capitalized or legacy roles 
--              (e.g., 'Admin', 'Police Officer') and strictly restricts INSERT 
--              on public.cases to authenticated users with the 'admin' role.
-- =============================================================================

DO $$
BEGIN
    -- Drop legacy policies that might be causing the RLS violation
    DROP POLICY IF EXISTS "Cases insertable by Police Officer or Admin" ON public.cases;
    DROP POLICY IF EXISTS "Cases insertable by admin or user" ON public.cases;
    DROP POLICY IF EXISTS "Cases insertable by admin" ON public.cases;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Create the strict admin-only policy
CREATE POLICY "Cases insertable by admin" ON public.cases
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );
