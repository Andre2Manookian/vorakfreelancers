-- Migration: Add missing columns
-- Run this in Supabase SQL Editor (one time)

-- Add payout_released to contracts
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS payout_released BOOLEAN DEFAULT FALSE;

-- Add ban fields to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ban_message TEXT;

-- Add contact fields to talent_profiles (kept for backward compat)
ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_telegram TEXT;

-- Add contact fields to users (all roles)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_telegram TEXT;
