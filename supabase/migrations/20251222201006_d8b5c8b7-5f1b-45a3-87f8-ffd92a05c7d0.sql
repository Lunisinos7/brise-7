-- Fix security issue: SmartThings Config Table Lacks Workspace Isolation
-- Add workspace_id column to smartthings_config table
ALTER TABLE public.smartthings_config 
ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Drop overly permissive RLS policies on smartthings_config
DROP POLICY IF EXISTS "Anyone can read smartthings_config" ON public.smartthings_config;
DROP POLICY IF EXISTS "Anyone can insert smartthings_config" ON public.smartthings_config;
DROP POLICY IF EXISTS "Anyone can update smartthings_config" ON public.smartthings_config;
DROP POLICY IF EXISTS "Anyone can delete smartthings_config" ON public.smartthings_config;

-- Create workspace-scoped RLS policies for smartthings_config
CREATE POLICY "Members can view workspace smartthings config"
ON public.smartthings_config FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert smartthings config"
ON public.smartthings_config FOR INSERT
WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update smartthings config"
ON public.smartthings_config FOR UPDATE
USING (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete smartthings config"
ON public.smartthings_config FOR DELETE
USING (is_workspace_admin(auth.uid(), workspace_id));

-- Fix security issue: Energy and Temperature History Exposed to Public
-- Drop overly permissive RLS policies on energy_history
DROP POLICY IF EXISTS "Anyone can read energy_history" ON public.energy_history;
DROP POLICY IF EXISTS "Anyone can insert energy_history" ON public.energy_history;
DROP POLICY IF EXISTS "Anyone can delete energy_history" ON public.energy_history;

-- Create workspace-scoped RLS policies for energy_history
CREATE POLICY "Members can view workspace energy history"
ON public.energy_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM equipments e
    WHERE e.id = energy_history.equipment_id
    AND is_workspace_member(auth.uid(), e.workspace_id)
  )
);

CREATE POLICY "Admins can insert energy history"
ON public.energy_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM equipments e
    WHERE e.id = energy_history.equipment_id
    AND is_workspace_admin(auth.uid(), e.workspace_id)
  )
);

CREATE POLICY "Admins can delete energy history"
ON public.energy_history FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM equipments e
    WHERE e.id = energy_history.equipment_id
    AND is_workspace_admin(auth.uid(), e.workspace_id)
  )
);

-- Drop overly permissive RLS policies on temperature_history
DROP POLICY IF EXISTS "Anyone can read temperature_history" ON public.temperature_history;
DROP POLICY IF EXISTS "Anyone can insert temperature_history" ON public.temperature_history;
DROP POLICY IF EXISTS "Anyone can delete temperature_history" ON public.temperature_history;

-- Create workspace-scoped RLS policies for temperature_history
CREATE POLICY "Members can view workspace temperature history"
ON public.temperature_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM equipments e
    WHERE e.id = temperature_history.equipment_id
    AND is_workspace_member(auth.uid(), e.workspace_id)
  )
);

CREATE POLICY "Admins can insert temperature history"
ON public.temperature_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM equipments e
    WHERE e.id = temperature_history.equipment_id
    AND is_workspace_admin(auth.uid(), e.workspace_id)
  )
);

CREATE POLICY "Admins can delete temperature history"
ON public.temperature_history FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM equipments e
    WHERE e.id = temperature_history.equipment_id
    AND is_workspace_admin(auth.uid(), e.workspace_id)
  )
);