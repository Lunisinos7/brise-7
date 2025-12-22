-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;

-- Create a new PERMISSIVE INSERT policy
CREATE POLICY "Users can create their own workspaces" 
ON public.workspaces 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Also fix workspace_members INSERT policy to allow self-insertion after creating workspace
DROP POLICY IF EXISTS "Admins can insert members" ON public.workspace_members;

CREATE POLICY "Users can insert themselves as members" 
ON public.workspace_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  is_workspace_admin(auth.uid(), workspace_id) 
  OR (auth.uid() = user_id AND has_workspace_role(auth.uid(), workspace_id, 'owner'))
);