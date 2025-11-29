-- Create client field configuration table
CREATE TABLE IF NOT EXISTS public.client_field_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, field_name)
);

-- Enable RLS
ALTER TABLE public.client_field_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_field_config
CREATE POLICY "Authenticated users can view their own field configs"
  ON public.client_field_config
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert their own field configs"
  ON public.client_field_config
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their own field configs"
  ON public.client_field_config
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete their own field configs"
  ON public.client_field_config
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER handle_client_field_config_updated_at
  BEFORE UPDATE ON public.client_field_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();