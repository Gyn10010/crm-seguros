-- Add max_hours and responsible_type columns to funnel_activity_templates
ALTER TABLE public.funnel_activity_templates
ADD COLUMN IF NOT EXISTS max_hours INTEGER NOT NULL DEFAULT 24,
ADD COLUMN IF NOT EXISTS responsible_type TEXT NOT NULL DEFAULT 'any';