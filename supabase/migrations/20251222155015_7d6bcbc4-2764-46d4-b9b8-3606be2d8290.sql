-- Create alerts table for storing system alerts
CREATE TABLE public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  equipment_id UUID,
  type TEXT NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
  message TEXT NOT NULL,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_by UUID,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create alert_settings table for workspace-specific alert configurations
CREATE TABLE public.alert_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL UNIQUE,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  temp_alert_min NUMERIC DEFAULT 16,
  temp_alert_max NUMERIC DEFAULT 28,
  efficiency_threshold NUMERIC DEFAULT 85,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alerts table
CREATE POLICY "Members can view workspace alerts"
ON public.alerts
FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert alerts"
ON public.alerts
FOR INSERT
WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update alerts"
ON public.alerts
FOR UPDATE
USING (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete alerts"
ON public.alerts
FOR DELETE
USING (is_workspace_admin(auth.uid(), workspace_id));

-- RLS Policies for alert_settings table
CREATE POLICY "Members can view workspace alert settings"
ON public.alert_settings
FOR SELECT
USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert alert settings"
ON public.alert_settings
FOR INSERT
WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update alert settings"
ON public.alert_settings
FOR UPDATE
USING (is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete alert settings"
ON public.alert_settings
FOR DELETE
USING (is_workspace_admin(auth.uid(), workspace_id));

-- Create trigger for updated_at on alert_settings
CREATE TRIGGER update_alert_settings_updated_at
BEFORE UPDATE ON public.alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for alerts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;