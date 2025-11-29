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