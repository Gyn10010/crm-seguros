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