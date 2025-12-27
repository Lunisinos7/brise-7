
-- Remove efficiency column from equipments table
ALTER TABLE public.equipments DROP COLUMN IF EXISTS efficiency;

-- Remove efficiency column from energy_history table
ALTER TABLE public.energy_history DROP COLUMN IF EXISTS efficiency;
