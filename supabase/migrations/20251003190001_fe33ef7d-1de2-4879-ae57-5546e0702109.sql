-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON public.policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_client_id ON public.policies(client_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON public.policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_end_date ON public.policies(end_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON public.opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_client_id ON public.opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_renewals_user_id ON public.renewals(user_id);
CREATE INDEX IF NOT EXISTS idx_renewals_status ON public.renewals(status);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_user_id ON public.insurance_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_activities_opportunity_id ON public.funnel_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_funnel_activity_templates_user_id ON public.funnel_activity_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_configurations_user_id ON public.funnel_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_stages_user_id ON public.funnel_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Update handle_new_user to make first user admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Vendedor')
  );
  
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- If first user, make them admin. Otherwise, regular user
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
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