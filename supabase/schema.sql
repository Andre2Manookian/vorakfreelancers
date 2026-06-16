-- VORAK FREELANCE — Full database schema
-- Run in Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'talent' CHECK (role IN ('employer', 'talent', 'admin')),
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  id_verified BOOLEAN DEFAULT FALSE,
  id_document_url TEXT,
  selfie_url TEXT,
  paypal_email TEXT,
  bank_details TEXT,
  balance DECIMAL DEFAULT 0,
  total_earned DECIMAL DEFAULT 0,
  total_spent DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  ban_expires_at TIMESTAMPTZ,
  ban_message TEXT,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.talent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  category TEXT,
  subcategory TEXT,
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL,
  tagline TEXT,
  portfolio_items JSONB DEFAULT '[]',
  contact_email TEXT,
  contact_telegram TEXT,
  rating_avg DECIMAL DEFAULT 0,
  total_reviews INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  total_earnings DECIMAL DEFAULT 0,
  availability TEXT DEFAULT 'available',
  response_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL NOT NULL,
  delivery_days INT NOT NULL,
  revisions INT DEFAULT 1,
  requirements TEXT,
  thumbnail_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  orders_count INT DEFAULT 0,
  rating_avg DECIMAL DEFAULT 0,
  total_reviews INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_courses_platform ON public.courses(platform);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON public.courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_is_featured ON public.courses(is_featured);

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_min DECIMAL,
  budget_max DECIMAL,
  deadline DATE,
  required_skills TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
  proposals_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  talent_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL,
  price DECIMAL NOT NULL,
  delivery_days INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, talent_id)
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('job', 'service')),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  employer_id UUID REFERENCES public.users(id) NOT NULL,
  talent_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL NOT NULL,
  commission_amount DECIMAL NOT NULL,
  talent_payout DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'awaiting_confirmation', 'active', 'work_submitted',
    'completed', 'disputed', 'cancelled', 'refunded'
  )),
  payment_method TEXT,
  payment_reference TEXT,
  payment_confirmed BOOLEAN DEFAULT FALSE,
  payment_confirmed_at TIMESTAMPTZ,
  paypal_order_id TEXT,
  work_submitted BOOLEAN DEFAULT FALSE,
  work_submitted_at TIMESTAMPTZ,
  work_description TEXT,
  work_files TEXT[] DEFAULT '{}',
  employer_approved BOOLEAN DEFAULT FALSE,
  employer_approved_at TIMESTAMPTZ,
  payout_released BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  dispute_opened_at TIMESTAMPTZ,
  admin_notes TEXT,
  deadline DATE,
  requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) NOT NULL,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INT,
  is_read BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.users(id) NOT NULL,
  reviewed_id UUID REFERENCES public.users(id) NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  amount DECIMAL NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('paypal', 'bank', 'wise')),
  account_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'rejected')),
  admin_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.users(id) NOT NULL,
  reported_user_id UUID REFERENCES public.users(id),
  contract_id UUID REFERENCES public.contracts(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_talent_profiles_user ON public.talent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_services_talent ON public.services(talent_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_proposals_job ON public.proposals(job_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employer ON public.contracts(employer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_talent ON public.contracts(talent_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_messages_contract ON public.messages(contract_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON public.reviews(reviewed_id);

-- Platform settings seed
INSERT INTO public.platform_settings (key, value) VALUES
  ('commission_rate', '8'),
  ('platform_name', 'Vorak Freelance'),
  ('platform_email', 'vorakfreelance@gmail.com'),
  ('admin_email', 'andremanookian02@gmail.com'),
  ('maintenance_mode', 'false'),
  ('announcement_active', 'false'),
  ('announcement_text', ''),
  ('banned_words', '["spam","scam","fraud"]')
ON CONFLICT (key) DO NOTHING;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'talent');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  IF NEW.email = 'andremanookian02@gmail.com' THEN
    user_role := 'admin';
  END IF;

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_name, user_role);

  IF user_role = 'talent' OR user_role = 'admin' THEN
    INSERT INTO public.talent_profiles (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Promote admin on login if email matches
CREATE OR REPLACE FUNCTION public.ensure_admin_role()
RETURNS VOID AS $$
BEGIN
  UPDATE public.users SET role = 'admin'
  WHERE id = auth.uid() AND email = 'andremanookian02@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Public profiles readable" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users update own" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users insert own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admin all users" ON public.users FOR ALL USING (public.is_admin());

-- TALENT PROFILES policies
CREATE POLICY "Talent profiles public read" ON public.talent_profiles FOR SELECT USING (true);
CREATE POLICY "Talent update own profile" ON public.talent_profiles FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Talent insert own profile" ON public.talent_profiles FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin all talent profiles" ON public.talent_profiles FOR ALL USING (public.is_admin());

-- SERVICES policies
CREATE POLICY "Services public read" ON public.services FOR SELECT USING (status = 'active' OR talent_id = auth.uid() OR public.is_admin());
CREATE POLICY "Talent manage own services" ON public.services FOR ALL USING (talent_id = auth.uid() OR public.is_admin());

-- JOBS policies
CREATE POLICY "Jobs public read" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Employer manage own jobs" ON public.jobs FOR ALL USING (employer_id = auth.uid() OR public.is_admin());

-- PROPOSALS policies
CREATE POLICY "Proposals read involved" ON public.proposals FOR SELECT USING (
  talent_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = proposals.job_id AND jobs.employer_id = auth.uid()) OR
  public.is_admin()
);
CREATE POLICY "Talent create proposals" ON public.proposals FOR INSERT WITH CHECK (talent_id = auth.uid());
CREATE POLICY "Talent update own proposals" ON public.proposals FOR UPDATE USING (talent_id = auth.uid() OR public.is_admin());
CREATE POLICY "Employer update job proposals" ON public.proposals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = proposals.job_id AND jobs.employer_id = auth.uid()) OR public.is_admin()
);

-- CONTRACTS policies
CREATE POLICY "Contracts read participants" ON public.contracts FOR SELECT USING (
  employer_id = auth.uid() OR talent_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Contracts insert participants" ON public.contracts FOR INSERT WITH CHECK (
  employer_id = auth.uid() OR talent_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "Contracts update participants" ON public.contracts FOR UPDATE USING (
  employer_id = auth.uid() OR talent_id = auth.uid() OR public.is_admin()
);

-- MESSAGES policies
CREATE POLICY "Messages read contract participants" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = messages.contract_id
    AND (c.employer_id = auth.uid() OR c.talent_id = auth.uid())
  ) OR public.is_admin()
);
CREATE POLICY "Messages insert sender" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_id
    AND (c.employer_id = auth.uid() OR c.talent_id = auth.uid())
  )
);
CREATE POLICY "Messages update read status" ON public.messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = messages.contract_id
    AND (c.employer_id = auth.uid() OR c.talent_id = auth.uid())
  ) OR public.is_admin()
);
CREATE POLICY "Admin all messages" ON public.messages FOR ALL USING (public.is_admin());

-- REVIEWS policies
CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews insert reviewer" ON public.reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Reviews update own response" ON public.reviews FOR UPDATE USING (reviewed_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin all reviews" ON public.reviews FOR ALL USING (public.is_admin());

-- WITHDRAWAL REQUESTS policies
CREATE POLICY "Withdrawals read own" ON public.withdrawal_requests FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Withdrawals insert own" ON public.withdrawal_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Withdrawals update admin" ON public.withdrawal_requests FOR UPDATE USING (public.is_admin());

-- NOTIFICATIONS policies
CREATE POLICY "Notifications read own" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Notifications insert system" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Notifications update own" ON public.notifications FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- REPORTS policies
CREATE POLICY "Reports insert own" ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Reports read own or admin" ON public.reports FOR SELECT USING (reporter_id = auth.uid() OR public.is_admin());
CREATE POLICY "Reports update admin" ON public.reports FOR UPDATE USING (public.is_admin());

-- PLATFORM SETTINGS policies
CREATE POLICY "Settings public read" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Settings admin write" ON public.platform_settings FOR ALL USING (public.is_admin());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
