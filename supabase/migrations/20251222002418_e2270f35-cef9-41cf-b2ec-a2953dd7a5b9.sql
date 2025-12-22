-- Drop the existing INSERT policy on workspace_members
DROP POLICY IF EXISTS "Users can insert themselves as members" ON public.workspace_members;

-- Create new policy that allows workspace owners to add themselves
CREATE POLICY "Users can insert themselves as members" 
ON public.workspace_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Admin of workspace can add members
  is_workspace_admin(auth.uid(), workspace_id) 
  -- Or the user is inserting themselves and is the workspace owner
  OR (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.id = workspace_id 
      AND w.owner_id = auth.uid()
    )
  )
);