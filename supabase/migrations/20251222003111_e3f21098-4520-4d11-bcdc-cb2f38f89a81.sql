-- Drop and recreate the function with explicit RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Insert directly bypassing RLS since this is a SECURITY DEFINER function
  INSERT INTO public.workspaces (name, owner_id)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email) || '''s Workspace', NEW.id)
  RETURNING id INTO new_workspace_id;
  
  -- Add the user as owner of their workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Failed to create workspace for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Grant execute to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user_workspace() TO service_role;

-- Also ensure the workspaces INSERT policy allows the service_role
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;

-- Create policy that ALSO allows service_role or when owner matches
CREATE POLICY "Users can create their own workspaces" 
ON public.workspaces 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Create a separate policy for service role to bypass
CREATE POLICY "Service role can insert workspaces"
ON public.workspaces
FOR INSERT
TO service_role
WITH CHECK (true);

-- Same for workspace_members
CREATE POLICY "Service role can insert members"
ON public.workspace_members
FOR INSERT
TO service_role
WITH CHECK (true);