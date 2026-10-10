-- =============================================================================
-- Migration: 20261010000003_evidence_text_content.sql
-- Description: Additive - adds text_content column to evidence_versions for
--              plain-text diffing (documents/logs); NULL for binary evidence.
-- =============================================================================

ALTER TABLE public.evidence_versions
    ADD COLUMN IF NOT EXISTS text_content TEXT;

ALTER TABLE public.evidence_versions
    ADD COLUMN IF NOT EXISTS creator_name TEXT;
