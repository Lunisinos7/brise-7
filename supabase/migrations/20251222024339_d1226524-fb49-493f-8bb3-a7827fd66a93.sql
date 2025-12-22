-- Create workspace_settings table for energy rate configuration
CREATE TABLE public.workspace_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kwh_rate NUMERIC NOT NULL DEFAULT 0.70,
  currency_symbol TEXT NOT NULL DEFAULT 'R$',
  currency_code TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

-- Enable RLS
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- Members can view their workspace settings
CREATE POLICY "Members can view workspace settings" 
ON public.workspace_settings 
FOR SELECT 
TO authenticated
USING (is_workspace_member(auth.uid(), workspace_id));

-- Admins can insert workspace settings
CREATE POLICY "Admins can insert workspace settings" 
ON public.workspace_settings 
FOR INSERT 
TO authenticated
WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

-- Admins can update workspace settings
CREATE POLICY "Admins can update workspace settings" 
ON public.workspace_settings 
FOR UPDATE 
TO authenticated
USING (is_workspace_admin(auth.uid(), workspace_id));

-- Admins can delete workspace settings
CREATE POLICY "Admins can delete workspace settings" 
ON public.workspace_settings 
FOR DELETE 
TO authenticated
USING (is_workspace_admin(auth.uid(), workspace_id));

-- Add trigger for updated_at
CREATE TRIGGER update_workspace_settings_updated_at
BEFORE UPDATE ON public.workspace_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();