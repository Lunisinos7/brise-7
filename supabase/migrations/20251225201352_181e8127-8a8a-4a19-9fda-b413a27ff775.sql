-- Create BRISE configuration table
CREATE TABLE public.brise_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brise_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brise_config
CREATE POLICY "Members can view workspace brise config"
ON public.brise_config
FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert brise config"
ON public.brise_config
FOR INSERT
WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update brise config"
ON public.brise_config
FOR UPDATE
USING (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete brise config"
ON public.brise_config
FOR DELETE
USING (is_workspace_admin(auth.uid(), workspace_id));

-- Add trigger for updated_at
CREATE TRIGGER update_brise_config_updated_at
BEFORE UPDATE ON public.brise_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add brise_device_id column to equipments table
ALTER TABLE public.equipments ADD COLUMN brise_device_id TEXT;