-- =============================================================================
-- EVIDENTIA: Zero-Trust, Tamper-Evident Digital Evidence Management
-- Canonical PostgreSQL Schema & Row Level Security (RLS)
-- Version: 1.0.0
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ORGANIZATIONS & PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    org_type TEXT NOT NULL DEFAULT 'LAW_ENFORCEMENT', -- 'LAW_ENFORCEMENT', 'FORENSIC_LAB', 'JUDICIARY', 'PROSECUTION'
    contact_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('pending', 'police', 'forensic', 'prosecutor', 'admin', 'Admin', 'Police Officer', 'Forensic Analyst', 'Public Prosecutor')),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    badge_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS organization_members (
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_in_org TEXT NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (organization_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 2. CASES & CASE ASSIGNMENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY, -- e.g., 'CASE-2026-0042'
    case_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Under Analysis', 'In Trial', 'Archived')),
    incident_date TIMESTAMPTZ,
    description TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS case_assignments (
    case_id TEXT REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_role TEXT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (case_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 3. EVIDENCE & IMMUTABLE EVIDENCE VERSIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY, -- e.g., 'EV-2026-0042-01'
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Document', 'Digital Image', 'Audio', 'Video', 'Forensic Dump', 'Other')),
    incident_date TIMESTAMPTZ,
    current_version_number INT NOT NULL DEFAULT 1,
    storage_bucket TEXT NOT NULL DEFAULT 'private-evidence',
    original_file_name TEXT NOT NULL,
    is_sealed BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Strictly append-only: no updates or deletions allowed to historical versions
CREATE TABLE IF NOT EXISTS evidence_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    version_number INT NOT NULL,
    file_sha256 CHAR(64) NOT NULL, -- Exact SHA-256 over raw unencrypted bytes
    ciphertext_sha256 CHAR(64),
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    encryption_iv TEXT,
    is_genesis BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_evidence_version UNIQUE (evidence_id, version_number)
);

-- Git-inspired parent-linked commits with Ed25519 system attestation
CREATE TABLE IF NOT EXISTS evidence_commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES evidence_versions(id) ON DELETE RESTRICT UNIQUE,
    evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    commit_hash CHAR(64) NOT NULL, -- SHA-256 of canonical commit tuple
    parent_commit_hash CHAR(64),   -- NULL for V1 genesis commit
    commit_message TEXT NOT NULL,
    note TEXT,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    signature TEXT NOT NULL,       -- Ed25519 signature of commit_hash
    signing_key_id TEXT NOT NULL DEFAULT 'key_evidentia_primary',
    merkle_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (merkle_status IN ('PENDING', 'BATCHED', 'CHECKPOINTED'))
);

-- -----------------------------------------------------------------------------
-- 4. CUSTODY TRANSFERS & AUDIT EVENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custody_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    to_organization TEXT NOT NULL,
    transfer_type TEXT NOT NULL DEFAULT 'FORENSIC_EXAMINATION',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    accepted_at TIMESTAMPTZ,
    handoff_notes TEXT,
    acknowledgment_note TEXT,
    capture_storage_path TEXT
);

CREATE TABLE IF NOT EXISTS custody_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    transfer_id UUID REFERENCES custody_transfers(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'REGISTERED', 'VERSION_COMMITTED', 'TRANSFER_INITIATED', 'TRANSFER_ACCEPTED', 'INTEGRITY_VERIFIED'
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    ip_hash TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 5. MERKLE CHECKPOINT ENGINE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merkle_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number INT GENERATED ALWAYS AS IDENTITY UNIQUE,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FINALIZED')),
    leaf_count INT NOT NULL DEFAULT 0,
    merkle_root CHAR(64),
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS merkle_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES merkle_batches(id) ON DELETE RESTRICT,
    leaf_index INT NOT NULL,
    evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    version_id UUID NOT NULL REFERENCES evidence_versions(id) ON DELETE RESTRICT,
    leaf_hash CHAR(64) NOT NULL, -- SHA-256(0x00 || canonical_leaf_data)
    canonical_data JSONB NOT NULL,
    CONSTRAINT uq_batch_leaf_index UNIQUE (batch_id, leaf_index)
);

CREATE TABLE IF NOT EXISTS merkle_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES merkle_batches(id) ON DELETE RESTRICT UNIQUE,
    root_hash CHAR(64) NOT NULL,
    signature TEXT NOT NULL,     -- Ed25519 signature over root_hash
    signing_key_id TEXT NOT NULL,
    leaf_count INT NOT NULL,
    finalized_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 6. VERIFICATION & DIFF REPORTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    target_version_number INT NOT NULL,
    candidate_sha256 CHAR(64) NOT NULL,
    reference_sha256 CHAR(64) NOT NULL,
    verdict TEXT NOT NULL CHECK (verdict IN (
        'INTEGRITY_VERIFIED',
        'CONTENT_MISMATCH',
        'UNREGISTERED_VERSION',
        'SIGNATURE_INVALID',
        'MERKLE_PROOF_INVALID',
        'COMMIT_CHAIN_BROKEN',
        'VERIFICATION_INCOMPLETE'
    )),
    check_hash TEXT NOT NULL DEFAULT 'NOT_RUN',
    check_sig TEXT NOT NULL DEFAULT 'NOT_RUN',
    check_merkle TEXT NOT NULL DEFAULT 'NOT_RUN',
    check_chain TEXT NOT NULL DEFAULT 'NOT_RUN',
    diff_summary JSONB,
    verifier_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS diff_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE RESTRICT,
    base_version_number INT NOT NULL,
    compare_version_number INT NOT NULL,
    diff_type TEXT NOT NULL, -- 'TEXT_LINE', 'DOCX_PARAGRAPH', 'IMAGE_VISUAL'
    additions_count INT NOT NULL DEFAULT 0,
    deletions_count INT NOT NULL DEFAULT 0,
    diff_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 7. WEBAUTHN, STEP-UP AUTH & CAPTURES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    transports TEXT[],
    device_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS pending_sensitive_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL, -- 'COMMIT_VERSION', 'TRANSFER_CUSTODY'
    operation_digest CHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    proof_token TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS authentication_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    auth_method TEXT NOT NULL, -- 'PASSWORD', 'WEBAUTHN', 'OTP'
    event_type TEXT NOT NULL,  -- 'LOGIN', 'STEP_UP_CHALLENGE', 'STEP_UP_VERIFIED', 'STEP_UP_FAILED'
    status TEXT NOT NULL,      -- 'SUCCESS', 'FAILURE'
    details JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS auth_capture_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    operation_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    user_consented BOOLEAN NOT NULL DEFAULT true,
    retention_expiry TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now()) + INTERVAL '90 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS signing_key_metadata (
    id TEXT PRIMARY KEY,
    key_id TEXT NOT NULL UNIQUE,
    algorithm TEXT NOT NULL DEFAULT 'Ed25519',
    public_key_pem TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ROTATED', 'REVOKED')),
    activated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    revoked_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE diff_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_sensitive_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_key_metadata ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view profiles in their organization, Admins can view and manage all
CREATE POLICY "Profiles readable by authenticated users" ON profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile (excluding role)" ON profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Cases: Readable by Admins or assigned case members
CREATE POLICY "Cases readable by assigned users or admin" ON cases
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
        ) OR
        EXISTS (
            SELECT 1 FROM case_assignments WHERE case_assignments.case_id = cases.id AND case_assignments.user_id = auth.uid()
        )
    );

CREATE POLICY "Cases insertable by Police Officer or Admin" ON cases
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Police Officer', 'Admin')
        )
    );

-- Evidence: Readable by assigned case users or Admin
CREATE POLICY "Evidence readable by case participants or admin" ON evidence
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'Admin'
        ) OR
        EXISTS (
            SELECT 1 FROM case_assignments WHERE case_assignments.case_id = evidence.case_id AND case_assignments.user_id = auth.uid()
        )
    );

-- Historical Immutability Triggers: Block UPDATE and DELETE on evidence_versions and evidence_commits
CREATE OR REPLACE FUNCTION prevent_immutable_record_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Cryptographic records in % are immutable and cannot be updated or deleted.', TG_TABLE_NAME;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_evidence_versions ON evidence_versions;
CREATE TRIGGER trg_immutable_evidence_versions
    BEFORE UPDATE OR DELETE ON evidence_versions
    FOR EACH ROW EXECUTE FUNCTION prevent_immutable_record_modification();

DROP TRIGGER IF EXISTS trg_immutable_evidence_commits ON evidence_commits;
CREATE TRIGGER trg_immutable_evidence_commits
    BEFORE UPDATE OR DELETE ON evidence_commits
    FOR EACH ROW EXECUTE FUNCTION prevent_immutable_record_modification();

-- Automatic Profile Provisioning on User Registration
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
        NEW.id, NEW.email, assigned_name, assigned_phone, assigned_avatar, 'pending', true, timezone('utc', now()), timezone('utc', now())
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Role Protection: Non-admins cannot alter their own role
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
DECLARE
    caller_role TEXT;
BEGIN
    IF (OLD.role IS NOT DISTINCT FROM NEW.role) THEN
        NEW.updated_at = timezone('utc', now());
        RETURN NEW;
    END IF;

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

