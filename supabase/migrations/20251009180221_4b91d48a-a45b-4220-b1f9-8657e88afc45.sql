-- Add new fields to policies table
ALTER TABLE public.policies
ADD COLUMN IF NOT EXISTS document_type text,
ADD COLUMN IF NOT EXISTS net_premium numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS generated_commission numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS payment_type text,
ADD COLUMN IF NOT EXISTS branch text,
ADD COLUMN IF NOT EXISTS product text,
ADD COLUMN IF NOT EXISTS item text,
ADD COLUMN IF NOT EXISTS proposal text,
ADD COLUMN IF NOT EXISTS endorsement_proposal text,
ADD COLUMN IF NOT EXISTS endorsement text,
ADD COLUMN IF NOT EXISTS seller_transfer numeric DEFAULT 0;

-- Create policy field configuration table
CREATE TABLE IF NOT EXISTS public.policy_field_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  field_name text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, field_name)
);

-- Enable RLS on policy_field_config
ALTER TABLE public.policy_field_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for policy_field_config
CREATE POLICY "Authenticated users can view their own field configs"
ON public.policy_field_config
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert their own field configs"
ON public.policy_field_config
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their own field configs"
ON public.policy_field_config
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete their own field configs"
ON public.policy_field_config
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at on policy_field_config
CREATE TRIGGER update_policy_field_config_updated_at
BEFORE UPDATE ON public.policy_field_config
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();