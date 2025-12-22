-- Create table for time routine exceptions
CREATE TABLE public.time_routine_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES time_routines(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  exception_type TEXT DEFAULT 'closed',
  custom_start_time TIME,
  custom_end_time TIME,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_routine_exceptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (via routine's workspace)
CREATE POLICY "Members can view workspace routine exceptions"
ON public.time_routine_exceptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM time_routines tr
    WHERE tr.id = routine_id
    AND is_workspace_member(auth.uid(), tr.workspace_id)
  )
);

CREATE POLICY "Admins can insert routine exceptions"
ON public.time_routine_exceptions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM time_routines tr
    WHERE tr.id = routine_id
    AND is_workspace_admin(auth.uid(), tr.workspace_id)
  )
);

CREATE POLICY "Admins can update routine exceptions"
ON public.time_routine_exceptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM time_routines tr
    WHERE tr.id = routine_id
    AND is_workspace_admin(auth.uid(), tr.workspace_id)
  )
);

CREATE POLICY "Admins can delete routine exceptions"
ON public.time_routine_exceptions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM time_routines tr
    WHERE tr.id = routine_id
    AND is_workspace_admin(auth.uid(), tr.workspace_id)
  )
);