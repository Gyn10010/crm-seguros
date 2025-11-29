-- Update handle_new_user to also create default funnel templates
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
  
  -- Create default funnel activity templates
  PERFORM public.create_default_funnel_templates(NEW.id);
  
  RETURN NEW;
END;
$$;