-- Allow authenticated users to view all profiles (needed for task assignment and team collaboration)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);