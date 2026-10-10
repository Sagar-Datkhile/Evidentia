-- =============================================================================
-- Migration: evidentia_roles_user_admin.sql
-- Description: Targeted user/admin role migration.
--              Consolidates roles to ('user', 'admin') with default 'user'.
--              Maps all legacy non-admin roles and pending records to 'user'.
--              Preserves admin/Admin as 'admin'.
--              Enforces strict RLS with can_access_case protection.
--              Guards role modification via trigger against self-elevation.
-- 
-- CAUTION: Review migration against live database and ensure backup before executing.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DATA MIGRATION: Map existing profiles to ('user', 'admin')
-- -----------------------------------------------------------------------------
-- Drop previous constraint to allow data transformation
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Preserve admin/Admin as 'admin'
UPDATE public.profiles
SET role = 'admin'
WHERE LOWER(TRIM(role)) = 'admin';

-- Map pending, police, forensic, prosecutor, and all other non-admin values to 'user'
UPDATE public.profiles
SET role = 'user'
WHERE role IS NULL OR LOWER(TRIM(role)) != 'admin';

-- Set default role to 'user'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- Apply strict CHECK constraint allowing only ('user', 'admin')
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('user', 'admin'));

-- -----------------------------------------------------------------------------
-- 2. AUTH PROVISIONING TRIGGER: Default new signups to 'user'
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

    -- Strictly default to 'user'; ignore any client-supplied role metadata
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        avatar_url,
        role,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        assigned_name,
        assigned_phone,
        assigned_avatar,
        'user',
        true,
        timezone('utc', now()),
        timezone('utc', now())
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

-- Ensure trigger exists on auth.users without duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. ROLE PROTECTION GUARD: Prohibit user self-elevation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- If role is not changing, allow update and update timestamp
    IF (OLD.role IS NOT DISTINCT FROM NEW.role) THEN
        NEW.updated_at = timezone('utc', now());
        RETURN NEW;
    END IF;

    -- If role is changing, verify caller is an active admin
    SELECT role INTO caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF caller_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Users cannot modify or elevate their own authorization role.';
    END IF;

    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- -----------------------------------------------------------------------------
-- 4. CASE & EVIDENCE AUTHORIZATION GUARD: can_access_case
-- -----------------------------------------------------------------------------
-- Requires caller to be an active admin or actively assigned in case_assignments.
-- Prevents standard users from universal access to unassigned cases.
CREATE OR REPLACE FUNCTION public.can_access_case(p_case_id TEXT, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id AND role = 'admin' AND is_active = true
    ) OR EXISTS (
        SELECT 1 FROM public.case_assignments
        WHERE case_id = p_case_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- Profiles: Readable by authenticated users; update guarded by trigger
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile (excluding role)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Cases: Scoped via can_access_case
DROP POLICY IF EXISTS "Cases readable by assigned users or admin" ON public.cases;
CREATE POLICY "Cases readable by assigned users or admin" ON public.cases
    FOR SELECT TO authenticated USING (
        public.can_access_case(cases.id, auth.uid())
    );

DROP POLICY IF EXISTS "Cases insertable by Police Officer or Admin" ON public.cases;
DROP POLICY IF EXISTS "Cases insertable by admin or user" ON public.cases;
CREATE POLICY "Cases insertable by admin or user" ON public.cases
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'user')
        )
    );

-- Evidence: Scoped via can_access_case
DROP POLICY IF EXISTS "Evidence readable by case participants or admin" ON public.evidence;
CREATE POLICY "Evidence readable by case participants or admin" ON public.evidence
    FOR SELECT TO authenticated USING (
        public.can_access_case(evidence.case_id, auth.uid())
    );
