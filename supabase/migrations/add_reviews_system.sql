-- Add service_id to reviews so services can have their own reviews/comments
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE CASCADE;

-- Make reviewed_id nullable (service reviews don't reference a talent user)
ALTER TABLE public.reviews
  ALTER COLUMN reviewed_id DROP NOT NULL;

-- One review per user per service
CREATE UNIQUE INDEX IF NOT EXISTS uniq_reviewer_service
  ON public.reviews (reviewer_id, service_id)
  WHERE service_id IS NOT NULL;

-- One review per user per talent (talent-only reviews, no service_id)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_reviewer_talent
  ON public.reviews (reviewer_id, reviewed_id)
  WHERE reviewed_id IS NOT NULL AND service_id IS NULL;

-- ── Trigger: keep services.rating_avg and services.total_reviews in sync ──

CREATE OR REPLACE FUNCTION sync_service_rating()
RETURNS TRIGGER AS $$
DECLARE v_sid UUID;
BEGIN
  v_sid := CASE WHEN TG_OP = 'DELETE' THEN OLD.service_id ELSE NEW.service_id END;
  IF v_sid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  UPDATE public.services SET
    rating_avg    = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM public.reviews WHERE service_id = v_sid), 0),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE service_id = v_sid)
  WHERE id = v_sid;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_service_rating ON public.reviews;
CREATE TRIGGER trg_sync_service_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION sync_service_rating();

-- ── Trigger: keep talent_profiles.rating_avg and total_reviews in sync ──

CREATE OR REPLACE FUNCTION sync_talent_rating()
RETURNS TRIGGER AS $$
DECLARE v_tid UUID;
BEGIN
  v_tid := CASE WHEN TG_OP = 'DELETE' THEN OLD.reviewed_id ELSE NEW.reviewed_id END;
  IF v_tid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  UPDATE public.talent_profiles SET
    rating_avg    = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM public.reviews WHERE reviewed_id = v_tid AND service_id IS NULL), 0),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE reviewed_id = v_tid AND service_id IS NULL)
  WHERE user_id = v_tid;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_talent_rating ON public.reviews;
CREATE TRIGGER trg_sync_talent_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION sync_talent_rating();
