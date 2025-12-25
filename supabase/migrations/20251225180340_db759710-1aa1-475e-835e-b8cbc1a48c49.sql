-- Create occupancy_automations table
CREATE TABLE public.occupancy_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  inactivity_timeout_minutes INTEGER NOT NULL DEFAULT 15,
  reactivation_enabled BOOLEAN NOT NULL DEFAULT true,
  respect_time_routines BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create occupancy_automation_environments junction table
CREATE TABLE public.occupancy_automation_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.occupancy_automations(id) ON DELETE CASCADE,
  environment_id UUID NOT NULL REFERENCES public.environments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(automation_id, environment_id)
);

-- Create occupancy_events table for logging
CREATE TABLE public.occupancy_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.occupancy_automations(id) ON DELETE CASCADE,
  environment_id UUID REFERENCES public.environments(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('motion_detected', 'inactivity_timeout', 'turned_off', 'turned_on')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.occupancy_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_automation_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for occupancy_automations
CREATE POLICY "Members can view workspace occupancy automations"
ON public.occupancy_automations
FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert occupancy automations"
ON public.occupancy_automations
FOR INSERT
WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update occupancy automations"
ON public.occupancy_automations
FOR UPDATE
USING (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete occupancy automations"
ON public.occupancy_automations
FOR DELETE
USING (is_workspace_admin(auth.uid(), workspace_id));

-- RLS policies for occupancy_automation_environments
CREATE POLICY "Members can view occupancy automation environments"
ON public.occupancy_automation_environments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.occupancy_automations oa
    WHERE oa.id = automation_id
    AND is_workspace_member(auth.uid(), oa.workspace_id)
  )
);

CREATE POLICY "Admins can insert occupancy automation environments"
ON public.occupancy_automation_environments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.occupancy_automations oa
    WHERE oa.id = automation_id
    AND is_workspace_admin(auth.uid(), oa.workspace_id)
  )
);

CREATE POLICY "Admins can update occupancy automation environments"
ON public.occupancy_automation_environments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.occupancy_automations oa
    WHERE oa.id = automation_id
    AND is_workspace_admin(auth.uid(), oa.workspace_id)
  )
);

CREATE POLICY "Admins can delete occupancy automation environments"
ON public.occupancy_automation_environments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.occupancy_automations oa
    WHERE oa.id = automation_id
    AND is_workspace_admin(auth.uid(), oa.workspace_id)
  )
);

-- RLS policies for occupancy_events
CREATE POLICY "Members can view occupancy events"
ON public.occupancy_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.occupancy_automations oa
    WHERE oa.id = automation_id
    AND is_workspace_member(auth.uid(), oa.workspace_id)
  )
);

CREATE POLICY "Admins can insert occupancy events"
ON public.occupancy_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.occupancy_automations oa
    WHERE oa.id = automation_id
    AND is_workspace_admin(auth.uid(), oa.workspace_id)
  )
);

CREATE POLICY "Admins can delete occupancy events"
ON public.occupancy_events
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.occupancy_automations oa
    WHERE oa.id = automation_id
    AND is_workspace_admin(auth.uid(), oa.workspace_id)
  )
);

-- Add trigger for updated_at on occupancy_automations
CREATE TRIGGER update_occupancy_automations_updated_at
BEFORE UPDATE ON public.occupancy_automations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_occupancy_automations_workspace_id ON public.occupancy_automations(workspace_id);
CREATE INDEX idx_occupancy_automation_environments_automation_id ON public.occupancy_automation_environments(automation_id);
CREATE INDEX idx_occupancy_events_automation_id ON public.occupancy_events(automation_id);
CREATE INDEX idx_occupancy_events_created_at ON public.occupancy_events(created_at DESC);