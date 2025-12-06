-- Add started_at field to funnel_activities table for activity timer tracking
ALTER TABLE public.funnel_activities
ADD COLUMN started_at TIMESTAMPTZ;

-- Add comment explaining the field
COMMENT ON COLUMN public.funnel_activities.started_at IS 'Timestamp when the activity timer started. First activity starts when opportunity is created, subsequent activities start when previous activity is completed.';
