-- Create workspace role enum
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'viewer');

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workspace_members table (replaces global user_roles for workspace context)
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create workspace_invitations table
CREATE TABLE public.workspace_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role workspace_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email)
);

-- Add workspace_id to equipments
ALTER TABLE public.equipments ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to environments
ALTER TABLE public.environments ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to time_routines
ALTER TABLE public.time_routines ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
  )
$$;

-- Security definer function to check workspace role
CREATE OR REPLACE FUNCTION public.has_workspace_role(_user_id UUID, _workspace_id UUID, _role workspace_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND role = _role
  )
$$;

-- Security definer function to check if user is workspace admin or owner
CREATE OR REPLACE FUNCTION public.is_workspace_admin(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND role IN ('owner', 'admin')
  )
$$;

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they are members of"
ON public.workspaces FOR SELECT
USING (public.is_workspace_member(auth.uid(), id));

CREATE POLICY "Users can create their own workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Only owners can update their workspaces"
ON public.workspaces FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Only owners can delete their workspaces"
ON public.workspaces FOR DELETE
USING (auth.uid() = owner_id);

-- RLS Policies for workspace_members
CREATE POLICY "Members can view workspace members"
ON public.workspace_members FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert members"
ON public.workspace_members FOR INSERT
WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id) OR auth.uid() = user_id);

CREATE POLICY "Admins can update members"
ON public.workspace_members FOR UPDATE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete members"
ON public.workspace_members FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id) AND user_id != (SELECT owner_id FROM public.workspaces WHERE id = workspace_id));

-- RLS Policies for workspace_invitations
CREATE POLICY "Members can view invitations"
ON public.workspace_invitations FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can create invitations"
ON public.workspace_invitations FOR INSERT
WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update invitations"
ON public.workspace_invitations FOR UPDATE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete invitations"
ON public.workspace_invitations FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Update RLS for equipments to use workspace
DROP POLICY IF EXISTS "Anyone can read equipments" ON public.equipments;
DROP POLICY IF EXISTS "Anyone can insert equipments" ON public.equipments;
DROP POLICY IF EXISTS "Anyone can update equipments" ON public.equipments;
DROP POLICY IF EXISTS "Anyone can delete equipments" ON public.equipments;

CREATE POLICY "Members can view workspace equipments"
ON public.equipments FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert equipments"
ON public.equipments FOR INSERT
WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update equipments"
ON public.equipments FOR UPDATE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete equipments"
ON public.equipments FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Update RLS for environments to use workspace
DROP POLICY IF EXISTS "Anyone can read environments" ON public.environments;
DROP POLICY IF EXISTS "Anyone can insert environments" ON public.environments;
DROP POLICY IF EXISTS "Anyone can update environments" ON public.environments;
DROP POLICY IF EXISTS "Anyone can delete environments" ON public.environments;

CREATE POLICY "Members can view workspace environments"
ON public.environments FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert environments"
ON public.environments FOR INSERT
WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update environments"
ON public.environments FOR UPDATE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete environments"
ON public.environments FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Update RLS for time_routines to use workspace
DROP POLICY IF EXISTS "Anyone can read time_routines" ON public.time_routines;
DROP POLICY IF EXISTS "Anyone can insert time_routines" ON public.time_routines;
DROP POLICY IF EXISTS "Anyone can update time_routines" ON public.time_routines;
DROP POLICY IF EXISTS "Anyone can delete time_routines" ON public.time_routines;

CREATE POLICY "Members can view workspace routines"
ON public.time_routines FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert routines"
ON public.time_routines FOR INSERT
WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update routines"
ON public.time_routines FOR UPDATE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete routines"
ON public.time_routines FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Function to create workspace for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create a personal workspace for the new user
  INSERT INTO public.workspaces (name, owner_id)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email) || '''s Workspace', NEW.id)
  RETURNING id INTO new_workspace_id;
  
  -- Add the user as owner of their workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Trigger to create workspace on user signup
CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_workspace();

-- Triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();