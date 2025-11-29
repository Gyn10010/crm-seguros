-- Add missing DELETE policy for system_settings table (admin-only)
CREATE POLICY "Admins can delete system settings" 
ON public.system_settings 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));