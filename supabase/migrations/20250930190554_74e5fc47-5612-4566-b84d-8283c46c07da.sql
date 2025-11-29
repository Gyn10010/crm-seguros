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