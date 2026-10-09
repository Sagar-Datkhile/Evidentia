-- =============================================================================
-- Migration: 20261010000002_auth_and_profiles_enhancement.sql
-- Description: Additive migration for Supabase Auth, profiles phone column,
--              default 'pending' role, auto-creation trigger, RLS policies,
--              and role self-elevation protection.
-- =============================================================================

-- 1. Ensure phone column exists on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Update role column constraints to support standard roles with 'pending' default
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending';

-- Drop previous check constraint if exists and add comprehensive check constraint
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('pending', 'police', 'forensic', 'prosecutor', 'admin', 'Admin', 'Police Officer', 'Forensic Analyst', 'Public Prosecutor'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 3. Automatic Profile Provisioning on User Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_name TEXT;
    assigned_phone TEXT;
    assigned_avatar TEXT;
BEGIN
    -- Extract metadata from OAuth or email signup
    assigned_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    assigned_phone := NEW.raw_user_meta_data->>'phone';
    assigned_avatar := NEW.raw_user_meta_data->>'avatar_url';

    -- Insert into public.profiles with safe default role 'pending'
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
        'pending',
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

-- Recreate trigger on auth.users safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Role Protection: Prevent users from self-elevating their own role
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

    -- If role is changing, verify if caller is an administrator
    SELECT role INTO caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF caller_role NOT IN ('admin', 'Admin') THEN
        RAISE EXCEPTION 'Unauthorized: Users cannot elevate or alter their own authorization role.';
    END IF;

    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- 5. Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Read policy: Authenticated users can view judicial profiles
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

-- Update policy: Users can update their own permitted fields (role guarded by trigger)
DROP POLICY IF EXISTS "Users can update own profile (excluding role)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Insert policy: Users can insert their own profile if not created by trigger
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Admin policy: Admins can manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'Admin')
        )
    );
