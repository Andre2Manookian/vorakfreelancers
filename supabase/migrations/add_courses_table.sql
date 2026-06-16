-- Create courses table if missing and add missing course columns.
-- Run this in Supabase SQL Editor (one time)

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  category TEXT NOT NULL,
  affiliate_url TEXT,
  cover_image_url TEXT,
  description TEXT,
  instructor_name TEXT,
  current_price DECIMAL DEFAULT 0,
  original_price DECIMAL DEFAULT 0,
  rating DECIMAL DEFAULT 0,
  students_count TEXT DEFAULT '0',
  duration TEXT,
  level TEXT DEFAULT 'All Levels',
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS instructor_name TEXT,
  ADD COLUMN IF NOT EXISTS current_price DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_price DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS students_count TEXT DEFAULT '0',
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'All Levels',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_courses_platform ON public.courses(platform);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON public.courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_is_featured ON public.courses(is_featured);
