-- Create table for funnel configurations
CREATE TABLE public.funnel_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  funnel_name TEXT NOT NULL,
  funnel_key TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, funnel_key)
);

-- Create table for funnel stages
CREATE TABLE public.funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  funnel_key TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, funnel_key, stage_key)
);

-- Enable RLS
ALTER TABLE public.funnel_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for funnel_configurations
CREATE POLICY "Users can view their own funnel configurations"
  ON public.funnel_configurations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own funnel configurations"
  ON public.funnel_configurations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funnel configurations"
  ON public.funnel_configurations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funnel configurations"
  ON public.funnel_configurations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for funnel_stages
CREATE POLICY "Users can view their own funnel stages"
  ON public.funnel_stages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own funnel stages"
  ON public.funnel_stages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funnel stages"
  ON public.funnel_stages
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funnel stages"
  ON public.funnel_stages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_funnel_configurations_updated_at
  BEFORE UPDATE ON public.funnel_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_funnel_stages_updated_at
  BEFORE UPDATE ON public.funnel_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create default funnel configurations
CREATE OR REPLACE FUNCTION public.create_default_funnel_configs(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default funnels
  INSERT INTO public.funnel_configurations (user_id, funnel_name, funnel_key, order_index) VALUES
    (p_user_id, 'Vendas', 'sales', 0),
    (p_user_id, 'Renovação', 'renewal', 1);
  
  -- Create default stages for Sales funnel
  INSERT INTO public.funnel_stages (user_id, funnel_key, stage_name, stage_key, order_index) VALUES
    (p_user_id, 'sales', 'Lead', 'lead', 0),
    (p_user_id, 'sales', 'Proposta', 'proposal', 1),
    (p_user_id, 'sales', 'Negociação', 'negotiation', 2),
    (p_user_id, 'sales', 'Fechamento', 'closing', 3);
  
  -- Create default stages for Renewal funnel
  INSERT INTO public.funnel_stages (user_id, funnel_key, stage_name, stage_key, order_index) VALUES
    (p_user_id, 'renewal', 'Novo', 'new', 0),
    (p_user_id, 'renewal', 'Em Andamento', 'in_progress', 1),
    (p_user_id, 'renewal', 'Concluído', 'completed', 2);
END;
$$;

-- Update handle_new_user to also create default funnel configurations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Vendedor')
  );
  
  -- Create default system settings
  INSERT INTO public.system_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default policy types
  INSERT INTO public.policy_types (user_id, name) VALUES
    (NEW.id, 'Automóvel'),
    (NEW.id, 'Residencial'),
    (NEW.id, 'Vida'),
    (NEW.id, 'Empresarial');
  
  -- Create default origins
  INSERT INTO public.origins (user_id, name) VALUES
    (NEW.id, 'Indicação'),
    (NEW.id, 'Website'),
    (NEW.id, 'Marketing');
  
  -- Create default funnel configurations and stages
  PERFORM public.create_default_funnel_configs(NEW.id);
  
  -- Create default funnel activity templates
  PERFORM public.create_default_funnel_templates(NEW.id);
  
  RETURN NEW;
END;
$$;