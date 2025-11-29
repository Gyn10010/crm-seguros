-- Create activity_templates table for admin-configured standard activities
CREATE TABLE IF NOT EXISTS public.activity_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  responsible_type TEXT NOT NULL, -- 'salesperson', 'technical', 'renewal', 'any'
  max_hours INTEGER NOT NULL DEFAULT 24, -- Maximum hours to complete the activity
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.activity_templates ENABLE ROW LEVEL SECURITY;

-- Policies for activity_templates
CREATE POLICY "Everyone can view active templates"
ON public.activity_templates
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage templates"
ON public.activity_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add due_date and due_time to funnel_activities
ALTER TABLE public.funnel_activities
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS due_time TIME;

-- Add trigger for updated_at
CREATE TRIGGER update_activity_templates_updated_at
BEFORE UPDATE ON public.activity_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create some default activity templates
INSERT INTO public.activity_templates (name, responsible_type, max_hours, order_index) VALUES
('Contato inicial com cliente', 'salesperson', 24, 0),
('Enviar proposta', 'salesperson', 48, 1),
('Análise técnica', 'technical', 72, 2),
('Negociação de valores', 'salesperson', 24, 3),
('Emissão de apólice', 'technical', 48, 4),
('Contato pós-venda', 'renewal', 168, 5)
ON CONFLICT DO NOTHING;