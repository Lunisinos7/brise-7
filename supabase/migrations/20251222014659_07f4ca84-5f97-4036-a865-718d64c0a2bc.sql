-- Create a security definer function to safely get the current user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Members can view invitations" ON workspace_invitations;

-- Create the new policy using the security definer function
CREATE POLICY "Members can view invitations" 
ON workspace_invitations 
FOR SELECT 
TO authenticated
USING (
  is_workspace_member(auth.uid(), workspace_id) 
  OR email = get_current_user_email()
);