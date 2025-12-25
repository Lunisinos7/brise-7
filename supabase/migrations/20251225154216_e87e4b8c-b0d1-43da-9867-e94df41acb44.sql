-- Add nominal_power column to equipments table
ALTER TABLE public.equipments 
ADD COLUMN nominal_power numeric NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN public.equipments.nominal_power IS 'Nominal power consumption in Watts. Used for energy consumption calculations when equipment is on.';