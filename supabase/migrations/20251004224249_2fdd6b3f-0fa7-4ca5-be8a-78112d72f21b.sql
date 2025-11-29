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