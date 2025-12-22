-- Create a function to create workspace and add owner atomically
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  _name text,
  _owner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id uuid;
BEGIN
  -- Create the workspace
  INSERT INTO public.workspaces (name, owner_id)
  VALUES (_name, _owner_id)
  RETURNING id INTO new_workspace_id;
  
  -- Add the owner as a member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, _owner_id, 'owner');
  
  RETURN new_workspace_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(text, uuid) TO authenticated;