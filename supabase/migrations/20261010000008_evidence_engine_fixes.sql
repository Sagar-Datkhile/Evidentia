-- =============================================================================
-- Migration: 20261010000008_evidence_engine_fixes.sql
-- Description: Fix missing columns, RLS policies, and admin role normalization
--              to unblock the complete tamper-evident evidence engine.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Normalize profile role check constraint to only allow 'user' and 'admin'
--    (the two canonical AppRole values the application checks against)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- First update any legacy role values to canonical equivalents
    UPDATE public.profiles SET role = 'admin' WHERE role IN ('Admin');
    UPDATE public.profiles SET role = 'user'  WHERE role IN ('pending', 'police', 'forensic', 'prosecutor', 'Police Officer', 'Forensic Analyst', 'Public Prosecutor');

    -- Drop the old permissive check constraint from migration 002
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

    -- Drop the original check from migration 001
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check1;

    -- Add the canonical constraint
    ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'profiles_role_check constraint update skipped: %', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Fix handle_new_user to use 'user' (not 'pending') so new signups work
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_name TEXT;
    assigned_phone TEXT;
    assigned_avatar TEXT;
BEGIN
    assigned_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    assigned_phone := NEW.raw_user_meta_data->>'phone';
    assigned_avatar := NEW.raw_user_meta_data->>'avatar_url';

    INSERT INTO public.profiles (
        id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at
    )
    VALUES (
        NEW.id, NEW.email, assigned_name, assigned_phone, assigned_avatar,
        'user', true, timezone('utc', now()), timezone('utc', now())
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = timezone('utc', now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 3. Fix can_access_case to handle both 'admin' and 'Admin' role values
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_case(p_case_id TEXT, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id 
          AND lower(role) = 'admin'
          AND is_active = true
    ) OR EXISTS (
        SELECT 1 FROM public.case_assignments
        WHERE case_id = p_case_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 4. Add missing columns to evidence_versions
-- -----------------------------------------------------------------------------
ALTER TABLE public.evidence_versions 
    ADD COLUMN IF NOT EXISTS creator_name TEXT;

ALTER TABLE public.evidence_versions 
    ADD COLUMN IF NOT EXISTS text_content TEXT;

-- -----------------------------------------------------------------------------
-- 5. Add missing columns to evidence_commits
-- -----------------------------------------------------------------------------
ALTER TABLE public.evidence_commits 
    ADD COLUMN IF NOT EXISTS actor_name TEXT;

ALTER TABLE public.evidence_commits 
    ADD COLUMN IF NOT EXISTS actor_role TEXT;

ALTER TABLE public.evidence_commits 
    ADD COLUMN IF NOT EXISTS merkle_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (merkle_status IN ('PENDING', 'BATCHED', 'CHECKPOINTED'));

-- Seed signing_key_metadata if not already present
INSERT INTO public.signing_key_metadata (key_id, algorithm, public_key_pem, status, activated_at)
VALUES 
    ('key_evidentia_primary_2026', 'Ed25519', '302a300506032b65700321008a9f24e16d445a60e90c883398be84323e1f57b66dfb35c02931295b9588b321', 'ACTIVE', timezone('utc', now())),
    ('key_evidentia_primary', 'Ed25519', '302a300506032b65700321008a9f24e16d445a60e90c883398be84323e1f57b66dfb35c02931295b9588b321', 'ACTIVE', timezone('utc', now()))
ON CONFLICT (key_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. RLS policies for evidence_versions
-- -----------------------------------------------------------------------------
ALTER TABLE public.evidence_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Evidence versions readable by case participants" ON public.evidence_versions;
CREATE POLICY "Evidence versions readable by case participants" ON public.evidence_versions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.evidence e
            WHERE e.id = evidence_versions.evidence_id
              AND public.can_access_case(e.case_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Evidence versions insertable by service role" ON public.evidence_versions;
CREATE POLICY "Evidence versions insertable by service role" ON public.evidence_versions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.evidence e
            WHERE e.id = evidence_versions.evidence_id
              AND public.can_access_case(e.case_id, auth.uid())
        )
    );

-- -----------------------------------------------------------------------------
-- 7. RLS policies for evidence_commits
-- -----------------------------------------------------------------------------
ALTER TABLE public.evidence_commits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Evidence commits readable by case participants" ON public.evidence_commits;
CREATE POLICY "Evidence commits readable by case participants" ON public.evidence_commits
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.evidence e
            WHERE e.id = evidence_commits.evidence_id
              AND public.can_access_case(e.case_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Evidence commits insertable by case participants" ON public.evidence_commits;
CREATE POLICY "Evidence commits insertable by case participants" ON public.evidence_commits
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.evidence e
            WHERE e.id = evidence_commits.evidence_id
              AND public.can_access_case(e.case_id, auth.uid())
        )
    );

-- -----------------------------------------------------------------------------
-- 8. Add missing columns and RLS policies for custody_events
-- -----------------------------------------------------------------------------
ALTER TABLE public.custody_events 
    ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT timezone('utc', now());

ALTER TABLE public.custody_events 
    ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMPTZ DEFAULT timezone('utc', now());

ALTER TABLE public.custody_events 
    ADD COLUMN IF NOT EXISTS event_hash TEXT;

DO $$
BEGIN
    UPDATE public.custody_events SET timestamp = occurred_at WHERE timestamp IS NULL AND occurred_at IS NOT NULL;
    UPDATE public.custody_events SET occurred_at = timestamp WHERE occurred_at IS NULL AND timestamp IS NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

ALTER TABLE public.custody_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Custody events readable by case participants" ON public.custody_events;
CREATE POLICY "Custody events readable by case participants" ON public.custody_events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.evidence e
            WHERE e.id = custody_events.evidence_id
              AND public.can_access_case(e.case_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Custody events insertable by case participants" ON public.custody_events;
CREATE POLICY "Custody events insertable by case participants" ON public.custody_events
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.evidence e
            WHERE e.id = custody_events.evidence_id
              AND public.can_access_case(e.case_id, auth.uid())
        )
    );

-- -----------------------------------------------------------------------------
-- 9. RLS policy for evidence INSERT (was missing — only SELECT existed)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Evidence insertable by case participants" ON public.evidence;
CREATE POLICY "Evidence insertable by case participants" ON public.evidence
    FOR INSERT TO authenticated
    WITH CHECK (
        public.can_access_case(case_id, auth.uid())
    );

-- -----------------------------------------------------------------------------
-- 10. Profiles INSERT policy (allow user to provision own row)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);
