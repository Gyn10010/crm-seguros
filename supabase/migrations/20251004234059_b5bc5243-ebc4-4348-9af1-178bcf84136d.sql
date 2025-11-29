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