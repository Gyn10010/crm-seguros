-- Create table for job roles/positions
CREATE TABLE public.job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_roles
CREATE POLICY "Authenticated users can view all job roles"
ON public.job_roles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert job roles"
ON public.job_roles FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all job roles"
ON public.job_roles FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all job roles"
ON public.job_roles FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_job_roles_updated_at
BEFORE UPDATE ON public.job_roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default job roles
INSERT INTO public.job_roles (user_id, name, order_index)
SELECT 
  auth.uid(),
  role_name,
  idx
FROM (
  VALUES 
    ('Vendedor', 0),
    ('Técnico', 1),
    ('Renovação', 2),
    ('Qualquer', 3)
) AS roles(role_name, idx)
WHERE auth.uid() IS NOT NULL;