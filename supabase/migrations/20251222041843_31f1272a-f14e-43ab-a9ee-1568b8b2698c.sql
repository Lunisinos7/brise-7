-- Add is_active column to environments table
ALTER TABLE public.environments
ADD COLUMN is_active boolean NOT NULL DEFAULT true;