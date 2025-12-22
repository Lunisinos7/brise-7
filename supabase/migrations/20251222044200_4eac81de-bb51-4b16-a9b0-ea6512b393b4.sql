-- Add setpoint columns to environments table
ALTER TABLE public.environments
ADD COLUMN IF NOT EXISTS is_automatic boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS cooling_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS heating_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS cool_trigger_temp numeric NOT NULL DEFAULT 28,
ADD COLUMN IF NOT EXISTS cool_target_temp numeric NOT NULL DEFAULT 24,
ADD COLUMN IF NOT EXISTS heat_trigger_temp numeric NOT NULL DEFAULT 18,
ADD COLUMN IF NOT EXISTS heat_target_temp numeric NOT NULL DEFAULT 22;