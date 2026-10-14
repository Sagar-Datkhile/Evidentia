-- =============================================================================
-- Migration: 20261010000005_add_profile_designation.sql
-- Description: Add professional designation column to profiles table
-- =============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS designation TEXT 
CHECK (designation IN ('Police Officer', 'Forensic Analyst', 'Public Prosecutor', 'Case Observer'));
