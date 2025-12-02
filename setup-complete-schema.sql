-- Combined migration for new Supabase project
-- Generated: 2025-12-02T19:15:53.190Z
-- Target: https://kcdgdgcswrcbuvtcnmbw.supabase.co


-- ========================================
-- Migration: 20250930190554_74e5fc47-5612-4566-b84d-8283c46c07da.sql
-- ========================================

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Gestor', 'Vendedor')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create insurance_companies table
CREATE TABLE public.insurance_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  portal_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create credentials table
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_company_id UUID NOT NULL REFERENCES public.insurance_companies(id) ON DELETE CASCADE,
  system_name TEXT NOT NULL,
  login TEXT NOT NULL,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL,
  insurance_company TEXT NOT NULL,
  type TEXT NOT NULL,
  premium DECIMAL(10, 2) NOT NULL DEFAULT 0,
  commission DECIMAL(5, 2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Ativa', 'Pendente', 'Expirada', 'Cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('A Fazer', 'Em Andamento', 'Concluído')),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  due_date DATE,
  recurrence TEXT NOT NULL CHECK (recurrence IN ('Nenhuma', 'Diária', 'Semanal', 'Mensal')),
  opportunity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create renewals table
CREATE TABLE public.renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Pendente', 'Em Negociação', 'Renovada', 'Perdida')),
  salesperson TEXT NOT NULL,
  next_contact_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create opportunities table
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  funnel_type TEXT NOT NULL,
  stage TEXT NOT NULL,
  title TEXT NOT NULL,
  value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  commission DECIMAL(5, 2) NOT NULL DEFAULT 0,
  expected_close_date DATE NOT NULL,
  deal_type TEXT NOT NULL,
  salesperson TEXT NOT NULL,
  origin TEXT NOT NULL,
  technical_responsible TEXT NOT NULL,
  renewal_responsible TEXT NOT NULL,
  insurance_type TEXT NOT NULL,
  insurance_company TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create funnel_activities table
CREATE TABLE public.funnel_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  stage TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create system_settings table
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT 'LDR Seguros',
  theme_color TEXT NOT NULL DEFAULT '#0052CC',
  currency TEXT NOT NULL DEFAULT 'BRL',
  renewal_alert_days INTEGER NOT NULL DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create policy_types table
CREATE TABLE public.policy_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create origins table
CREATE TABLE public.origins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.origins ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients policies
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Insurance companies policies
CREATE POLICY "Users can view their own insurance companies" ON public.insurance_companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own insurance companies" ON public.insurance_companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insurance companies" ON public.insurance_companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insurance companies" ON public.insurance_companies FOR DELETE USING (auth.uid() = user_id);

-- Credentials policies (via insurance companies)
CREATE POLICY "Users can view credentials of their insurance companies" ON public.credentials FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.insurance_companies WHERE id = credentials.insurance_company_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert credentials to their insurance companies" ON public.credentials FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.insurance_companies WHERE id = insurance_company_id AND user_id = auth.uid()));
CREATE POLICY "Users can update credentials of their insurance companies" ON public.credentials FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.insurance_companies WHERE id = insurance_company_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete credentials of their insurance companies" ON public.credentials FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.insurance_companies WHERE id = insurance_company_id AND user_id = auth.uid()));

-- Policies policies
CREATE POLICY "Users can view their own policies" ON public.policies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own policies" ON public.policies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own policies" ON public.policies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own policies" ON public.policies FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Renewals policies
CREATE POLICY "Users can view their own renewals" ON public.renewals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own renewals" ON public.renewals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own renewals" ON public.renewals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own renewals" ON public.renewals FOR DELETE USING (auth.uid() = user_id);

-- Opportunities policies
CREATE POLICY "Users can view their own opportunities" ON public.opportunities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own opportunities" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own opportunities" ON public.opportunities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own opportunities" ON public.opportunities FOR DELETE USING (auth.uid() = user_id);

-- Funnel activities policies (via opportunities)
CREATE POLICY "Users can view activities of their opportunities" ON public.funnel_activities FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.opportunities WHERE id = funnel_activities.opportunity_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert activities to their opportunities" ON public.funnel_activities FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.opportunities WHERE id = opportunity_id AND user_id = auth.uid()));
CREATE POLICY "Users can update activities of their opportunities" ON public.funnel_activities FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.opportunities WHERE id = opportunity_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete activities of their opportunities" ON public.funnel_activities FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.opportunities WHERE id = opportunity_id AND user_id = auth.uid()));

-- System settings policies
CREATE POLICY "Users can view their own settings" ON public.system_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.system_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.system_settings FOR UPDATE USING (auth.uid() = user_id);

-- Policy types policies
CREATE POLICY "Users can view their own policy types" ON public.policy_types FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own policy types" ON public.policy_types FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own policy types" ON public.policy_types FOR DELETE USING (auth.uid() = user_id);

-- Origins policies
CREATE POLICY "Users can view their own origins" ON public.origins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own origins" ON public.origins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own origins" ON public.origins FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.insurance_companies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.credentials FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.renewals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.funnel_activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ========================================
-- Migration: 20250930190620_084a4102-a5ef-4f61-9e9d-904b602850c5.sql
-- ========================================

-- Fix function search path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ========================================
-- Migration: 20251003124847_23cd6394-a68d-4676-9cc1-4ae642f1937e.sql
-- ========================================

-- Create table for funnel activity templates
CREATE TABLE public.funnel_activity_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  funnel_type TEXT NOT NULL,
  stage TEXT NOT NULL,
  activity_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funnel_activity_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own funnel activity templates"
  ON public.funnel_activity_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own funnel activity templates"
  ON public.funnel_activity_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funnel activity templates"
  ON public.funnel_activity_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funnel activity templates"
  ON public.funnel_activity_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_funnel_activity_templates_updated_at
  BEFORE UPDATE ON public.funnel_activity_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert some default templates for new users
CREATE OR REPLACE FUNCTION public.create_default_funnel_templates(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sales funnel templates
  INSERT INTO public.funnel_activity_templates (user_id, funnel_type, stage, activity_text, order_index) VALUES
    (p_user_id, 'Vendas', 'Lead', 'Primeiro contato com o cliente', 0),
    (p_user_id, 'Vendas', 'Lead', 'Qualificação das necessidades', 1),
    (p_user_id, 'Vendas', 'Proposta', 'Enviar cotação', 0),
    (p_user_id, 'Vendas', 'Proposta', 'Apresentar proposta', 1),
    (p_user_id, 'Vendas', 'Negociação', 'Negociar condições', 0),
    (p_user_id, 'Vendas', 'Negociação', 'Ajustar proposta', 1),
    (p_user_id, 'Vendas', 'Fechamento', 'Emitir apólice', 0),
    (p_user_id, 'Vendas', 'Fechamento', 'Enviar documentação', 1);
  
  -- Renewal funnel templates
  INSERT INTO public.funnel_activity_templates (user_id, funnel_type, stage, activity_text, order_index) VALUES
    (p_user_id, 'Renovação', 'Novo', 'Contatar cliente para renovação', 0),
    (p_user_id, 'Renovação', 'Novo', 'Verificar dados atualizados', 1),
    (p_user_id, 'Renovação', 'Em Andamento', 'Enviar proposta de renovação', 0),
    (p_user_id, 'Renovação', 'Em Andamento', 'Acompanhar resposta', 1),
    (p_user_id, 'Renovação', 'Concluído', 'Confirmar renovação', 0),
    (p_user_id, 'Renovação', 'Concluído', 'Atualizar dados no sistema', 1);
END;
$$;


-- ========================================
-- Migration: 20251003124924_97a28b3a-0d0d-4c4d-92cb-93e39176c70e.sql
-- ========================================

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


-- ========================================
-- Migration: 20251003125412_1d7c1f2a-93ed-4f07-88d2-6d387497ec1b.sql
-- ========================================

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


-- ========================================
-- Migration: 20251003131511_0809d8d7-d13f-4f0c-a787-dd9356fb6153.sql
-- ========================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Update handle_new_user to assign default user role
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
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
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

-- RLS policies for profiles to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ========================================
-- Migration: 20251003190001_fe33ef7d-1de2-4879-ae57-5546e0702109.sql
-- ========================================

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


-- ========================================
-- Migration: 20251004224249_2fdd6b3f-0fa7-4ca5-be8a-78112d72f21b.sql
-- ========================================

-- Update RLS policies to make data shared across all authenticated users
-- Only tasks remain individual

-- CLIENTS: Shared across all users
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

CREATE POLICY "Authenticated users can view all clients" 
ON public.clients FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert clients" 
ON public.clients FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all clients" 
ON public.clients FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all clients" 
ON public.clients FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- POLICIES: Shared across all users
DROP POLICY IF EXISTS "Users can view their own policies" ON public.policies;
DROP POLICY IF EXISTS "Users can insert their own policies" ON public.policies;
DROP POLICY IF EXISTS "Users can update their own policies" ON public.policies;
DROP POLICY IF EXISTS "Users can delete their own policies" ON public.policies;

CREATE POLICY "Authenticated users can view all policies" 
ON public.policies FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert policies" 
ON public.policies FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all policies" 
ON public.policies FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all policies" 
ON public.policies FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- OPPORTUNITIES: Shared across all users
DROP POLICY IF EXISTS "Users can view their own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can insert their own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can update their own opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can delete their own opportunities" ON public.opportunities;

CREATE POLICY "Authenticated users can view all opportunities" 
ON public.opportunities FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert opportunities" 
ON public.opportunities FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all opportunities" 
ON public.opportunities FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all opportunities" 
ON public.opportunities FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- RENEWALS: Shared across all users
DROP POLICY IF EXISTS "Users can view their own renewals" ON public.renewals;
DROP POLICY IF EXISTS "Users can insert their own renewals" ON public.renewals;
DROP POLICY IF EXISTS "Users can update their own renewals" ON public.renewals;
DROP POLICY IF EXISTS "Users can delete their own renewals" ON public.renewals;

CREATE POLICY "Authenticated users can view all renewals" 
ON public.renewals FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert renewals" 
ON public.renewals FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all renewals" 
ON public.renewals FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all renewals" 
ON public.renewals FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- INSURANCE_COMPANIES: Shared across all users
DROP POLICY IF EXISTS "Users can view their own insurance companies" ON public.insurance_companies;
DROP POLICY IF EXISTS "Users can insert their own insurance companies" ON public.insurance_companies;
DROP POLICY IF EXISTS "Users can update their own insurance companies" ON public.insurance_companies;
DROP POLICY IF EXISTS "Users can delete their own insurance companies" ON public.insurance_companies;

CREATE POLICY "Authenticated users can view all insurance companies" 
ON public.insurance_companies FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert insurance companies" 
ON public.insurance_companies FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all insurance companies" 
ON public.insurance_companies FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all insurance companies" 
ON public.insurance_companies FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- CREDENTIALS: Shared across all users (via insurance_companies)
DROP POLICY IF EXISTS "Users can view credentials of their insurance companies" ON public.credentials;
DROP POLICY IF EXISTS "Users can insert credentials to their insurance companies" ON public.credentials;
DROP POLICY IF EXISTS "Users can update credentials of their insurance companies" ON public.credentials;
DROP POLICY IF EXISTS "Users can delete credentials of their insurance companies" ON public.credentials;

CREATE POLICY "Authenticated users can view all credentials" 
ON public.credentials FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert credentials" 
ON public.credentials FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all credentials" 
ON public.credentials FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all credentials" 
ON public.credentials FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- FUNNEL_ACTIVITIES: Shared across all users (via opportunities)
DROP POLICY IF EXISTS "Users can view activities of their opportunities" ON public.funnel_activities;
DROP POLICY IF EXISTS "Users can insert activities to their opportunities" ON public.funnel_activities;
DROP POLICY IF EXISTS "Users can update activities of their opportunities" ON public.funnel_activities;
DROP POLICY IF EXISTS "Users can delete activities of their opportunities" ON public.funnel_activities;

CREATE POLICY "Authenticated users can view all funnel activities" 
ON public.funnel_activities FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert funnel activities" 
ON public.funnel_activities FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all funnel activities" 
ON public.funnel_activities FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all funnel activities" 
ON public.funnel_activities FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- ORIGINS: Shared across all users
DROP POLICY IF EXISTS "Users can view their own origins" ON public.origins;
DROP POLICY IF EXISTS "Users can insert their own origins" ON public.origins;
DROP POLICY IF EXISTS "Users can delete their own origins" ON public.origins;

CREATE POLICY "Authenticated users can view all origins" 
ON public.origins FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert origins" 
ON public.origins FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all origins" 
ON public.origins FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- POLICY_TYPES: Shared across all users
DROP POLICY IF EXISTS "Users can view their own policy types" ON public.policy_types;
DROP POLICY IF EXISTS "Users can insert their own policy types" ON public.policy_types;
DROP POLICY IF EXISTS "Users can delete their own policy types" ON public.policy_types;

CREATE POLICY "Authenticated users can view all policy types" 
ON public.policy_types FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert policy types" 
ON public.policy_types FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all policy types" 
ON public.policy_types FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- FUNNEL_CONFIGURATIONS: Shared across all users
DROP POLICY IF EXISTS "Users can view their own funnel configurations" ON public.funnel_configurations;
DROP POLICY IF EXISTS "Users can insert their own funnel configurations" ON public.funnel_configurations;
DROP POLICY IF EXISTS "Users can update their own funnel configurations" ON public.funnel_configurations;
DROP POLICY IF EXISTS "Users can delete their own funnel configurations" ON public.funnel_configurations;

CREATE POLICY "Authenticated users can view all funnel configurations" 
ON public.funnel_configurations FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert funnel configurations" 
ON public.funnel_configurations FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all funnel configurations" 
ON public.funnel_configurations FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all funnel configurations" 
ON public.funnel_configurations FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- FUNNEL_STAGES: Shared across all users
DROP POLICY IF EXISTS "Users can view their own funnel stages" ON public.funnel_stages;
DROP POLICY IF EXISTS "Users can insert their own funnel stages" ON public.funnel_stages;
DROP POLICY IF EXISTS "Users can update their own funnel stages" ON public.funnel_stages;
DROP POLICY IF EXISTS "Users can delete their own funnel stages" ON public.funnel_stages;

CREATE POLICY "Authenticated users can view all funnel stages" 
ON public.funnel_stages FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert funnel stages" 
ON public.funnel_stages FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all funnel stages" 
ON public.funnel_stages FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all funnel stages" 
ON public.funnel_stages FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- FUNNEL_ACTIVITY_TEMPLATES: Shared across all users
DROP POLICY IF EXISTS "Users can view their own funnel activity templates" ON public.funnel_activity_templates;
DROP POLICY IF EXISTS "Users can insert their own funnel activity templates" ON public.funnel_activity_templates;
DROP POLICY IF EXISTS "Users can update their own funnel activity templates" ON public.funnel_activity_templates;
DROP POLICY IF EXISTS "Users can delete their own funnel activity templates" ON public.funnel_activity_templates;

CREATE POLICY "Authenticated users can view all funnel activity templates" 
ON public.funnel_activity_templates FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert funnel activity templates" 
ON public.funnel_activity_templates FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all funnel activity templates" 
ON public.funnel_activity_templates FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all funnel activity templates" 
ON public.funnel_activity_templates FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- SYSTEM_SETTINGS: Shared across all users
DROP POLICY IF EXISTS "Users can view their own settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.system_settings;

CREATE POLICY "Authenticated users can view all system settings" 
ON public.system_settings FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert system settings" 
ON public.system_settings FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all system settings" 
ON public.system_settings FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- TASKS remain individual (no changes needed)
-- Tasks policies already restrict to auth.uid() = user_id


-- ========================================
-- Migration: 20251004224830_0371c816-3940-497e-a6c5-af367c7d7d0f.sql
-- ========================================

-- Add missing DELETE policy for system_settings table (admin-only)
CREATE POLICY "Admins can delete system settings" 
ON public.system_settings 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));


-- ========================================
-- Migration: 20251004225522_9a6828e6-334a-4f5d-84cf-298f17761ed9.sql
-- ========================================

-- Fix critical security issue: Restrict credentials table access to admin-only
-- Currently ANY authenticated user can view/modify insurance portal credentials

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all credentials" ON public.credentials;
DROP POLICY IF EXISTS "Authenticated users can insert credentials" ON public.credentials;
DROP POLICY IF EXISTS "Authenticated users can update all credentials" ON public.credentials;
DROP POLICY IF EXISTS "Authenticated users can delete all credentials" ON public.credentials;

-- Create admin-only policies using has_role() function
CREATE POLICY "Admins can view credentials" 
ON public.credentials 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert credentials" 
ON public.credentials 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update credentials" 
ON public.credentials 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete credentials" 
ON public.credentials 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));


-- ========================================
-- Migration: 20251004230236_90a8bf2d-bf89-453f-99f7-f5c87fe70519.sql
-- ========================================

-- Security Fix #1: Implement credential encryption using pgcrypto
-- This addresses the CRITICAL plaintext password storage vulnerability

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted password column
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS encrypted_password BYTEA;

-- Create encryption key storage (admin access only)
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage encryption keys"
ON public.encryption_keys FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Security Fix #2: Implement audit logging
-- This addresses the missing audit trail vulnerability

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  details JSONB
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_log (user_id, action, table_name, record_id, details)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Create trigger function for credential access logging
CREATE OR REPLACE FUNCTION public.log_credential_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log credential access (only for SELECT operations in application context)
  PERFORM public.log_audit_event(
    'CREDENTIAL_ACCESS',
    'credentials',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'system_name', COALESCE(NEW.system_name, OLD.system_name)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers for credential operations
CREATE TRIGGER audit_credential_changes
AFTER INSERT OR UPDATE OR DELETE ON public.credentials
FOR EACH ROW EXECUTE FUNCTION public.log_credential_access();

-- Create trigger function for client PII access logging
CREATE OR REPLACE FUNCTION public.log_client_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.log_audit_event(
    'CLIENT_' || TG_OP,
    'clients',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'client_name', COALESCE(NEW.name, OLD.name)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add trigger for client data operations
CREATE TRIGGER audit_client_changes
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_client_access();

-- Create helper functions for credential encryption/decryption
CREATE OR REPLACE FUNCTION public.encrypt_credential(
  p_plaintext TEXT,
  p_key TEXT
)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_encrypt(p_plaintext, p_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_credential(
  p_encrypted BYTEA,
  p_key TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgp_sym_decrypt(p_encrypted, p_key);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;


-- ========================================
-- Migration: 20251004234059_b5bc5243-ebc4-4348-9af1-178bcf84136d.sql
-- ========================================

-- Drop existing policies for funnel_activities
DROP POLICY IF EXISTS "Authenticated users can view all funnel activities" ON public.funnel_activities;
DROP POLICY IF EXISTS "Authenticated users can insert funnel activities" ON public.funnel_activities;
DROP POLICY IF EXISTS "Authenticated users can update all funnel activities" ON public.funnel_activities;
DROP POLICY IF EXISTS "Authenticated users can delete all funnel activities" ON public.funnel_activities;

-- Create new policies that allow proper access control
-- Users can view activities where they are assigned
CREATE POLICY "Users can view activities assigned to them"
ON public.funnel_activities
FOR SELECT
USING (
  auth.uid() = assigned_to
);

-- Users can view activities from opportunities they created
CREATE POLICY "Users can view activities from their opportunities"
ON public.funnel_activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities
    WHERE opportunities.id = funnel_activities.opportunity_id
    AND opportunities.user_id = auth.uid()
  )
);

-- Admins can view all activities
CREATE POLICY "Admins can view all activities"
ON public.funnel_activities
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Users can insert activities for their opportunities
CREATE POLICY "Users can insert activities for their opportunities"
ON public.funnel_activities
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.opportunities
    WHERE opportunities.id = funnel_activities.opportunity_id
    AND opportunities.user_id = auth.uid()
  )
);

-- Users can update activities where they are assigned or created the opportunity
CREATE POLICY "Users can update their assigned activities"
ON public.funnel_activities
FOR UPDATE
USING (
  auth.uid() = assigned_to
  OR EXISTS (
    SELECT 1 FROM public.opportunities
    WHERE opportunities.id = funnel_activities.opportunity_id
    AND opportunities.user_id = auth.uid()
  )
);

-- Admins can update all activities
CREATE POLICY "Admins can update all activities"
ON public.funnel_activities
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Users can delete activities from their opportunities
CREATE POLICY "Users can delete activities from their opportunities"
ON public.funnel_activities
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities
    WHERE opportunities.id = funnel_activities.opportunity_id
    AND opportunities.user_id = auth.uid()
  )
);

-- Admins can delete all activities
CREATE POLICY "Admins can delete all activities"
ON public.funnel_activities
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
);


-- ========================================
-- Migration: 20251004234143_291a5e86-970a-4a2e-bb4a-6b9fe3172d0d.sql
-- ========================================

-- Allow authenticated users to view all profiles (needed for task assignment and team collaboration)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);


-- ========================================
-- Migration: 20251005024101_3de98062-fe54-4893-bcc1-69cef60f83c6.sql
-- ========================================

-- Remove duplicate origins, keeping only the oldest entry for each unique name
DELETE FROM origins a
USING origins b
WHERE a.id > b.id
  AND LOWER(a.name) = LOWER(b.name);

-- Remove duplicate policy_types, keeping only the oldest entry for each unique name  
DELETE FROM policy_types a
USING policy_types b
WHERE a.id > b.id
  AND LOWER(a.name) = LOWER(b.name);

-- Add unique constraint to prevent future duplicates (case insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS origins_name_unique_idx ON origins (LOWER(name));
CREATE UNIQUE INDEX IF NOT EXISTS policy_types_name_unique_idx ON policy_types (LOWER(name));


-- ========================================
-- Migration: 20251005024539_3e756b53-1cca-44d1-a192-3b639aa8097c.sql
-- ========================================

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


-- ========================================
-- Migration: 20251005031817_242f8a59-f31c-488b-852f-0558fa698803.sql
-- ========================================

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


-- ========================================
-- Migration: 20251005035525_db12635c-3365-4c7b-8e2e-2caa180cdbfc.sql
-- ========================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert activities for their opportunities" ON funnel_activities;
DROP POLICY IF EXISTS "Users can view activities from their opportunities" ON funnel_activities;
DROP POLICY IF EXISTS "Users can view activities assigned to them" ON funnel_activities;
DROP POLICY IF EXISTS "Users can update their assigned activities" ON funnel_activities;
DROP POLICY IF EXISTS "Users can delete activities from their opportunities" ON funnel_activities;

-- Create simpler and more permissive policies for authenticated users
CREATE POLICY "Authenticated users can insert activities"
ON funnel_activities
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view all activities"
ON funnel_activities
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all activities"
ON funnel_activities
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all activities"
ON funnel_activities
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);


-- ========================================
-- Migration: 20251005040302_ef767f0a-1e27-43ab-a20d-24b7263334e9.sql
-- ========================================

-- Add max_hours and responsible_type columns to funnel_activity_templates
ALTER TABLE public.funnel_activity_templates
ADD COLUMN IF NOT EXISTS max_hours INTEGER NOT NULL DEFAULT 24,
ADD COLUMN IF NOT EXISTS responsible_type TEXT NOT NULL DEFAULT 'any';


-- ========================================
-- Migration: 20251008185337_881c13b5-c4ba-4fbc-919a-be73c9e35b37.sql
-- ========================================

-- Add new columns to clients table
ALTER TABLE public.clients
ADD COLUMN person_type text CHECK (person_type IN ('Física', 'Jurídica')),
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN document text, -- CPF/CNPJ
ADD COLUMN salesperson text,
ADD COLUMN birth_date date,
ADD COLUMN business_sector text, -- ramo
ADD COLUMN monthly_income numeric,
ADD COLUMN license_expiry date, -- vencimento CNH
ADD COLUMN is_active boolean DEFAULT true,
ADD COLUMN marital_status text,
ADD COLUMN related_clients jsonb, -- array of {clientId, relationship}
ADD COLUMN profession text,
ADD COLUMN gender text CHECK (gender IN ('Masculino', 'Feminino', 'Outro', 'Prefiro não informar'));

-- Add indexes for better query performance
CREATE INDEX idx_clients_person_type ON public.clients(person_type);
CREATE INDEX idx_clients_salesperson ON public.clients(salesperson);
CREATE INDEX idx_clients_is_active ON public.clients(is_active);
CREATE INDEX idx_clients_city ON public.clients(city);
CREATE INDEX idx_clients_state ON public.clients(state);


-- ========================================
-- Migration: 20251008190358_7c1830bc-bfe3-4730-a522-abda2b55f04a.sql
-- ========================================

-- Add zip_code column to clients table
ALTER TABLE public.clients
ADD COLUMN zip_code text;


-- ========================================
-- Migration: 20251009180221_4b91d48a-a45b-4220-b1f9-8657e88afc45.sql
-- ========================================

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


-- ========================================
-- Migration: 20251009184606_a59f85b7-79f9-4eba-9b4d-ed736c5a0519.sql
-- ========================================

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


-- ========================================
-- Migration: 20251013185042_f9bf038c-6e6c-465d-94d8-ec3d97acd9ec.sql
-- ========================================

-- Tornar o campo address opcional na tabela clients
ALTER TABLE public.clients 
ALTER COLUMN address DROP NOT NULL;


-- ========================================
-- Migration: 20251202143630_add_permissions_to_profiles.sql
-- ========================================

-- Add permissions column to profiles table
-- This column will store an array of page permissions for each user
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN profiles.permissions IS 'Array of page view permissions for the user. Example: ["Dashboard", "Clients", "Policies"]';


