-- Force policy refresh by dropping and recreating
DROP POLICY IF EXISTS "Users can create their own workspaces" ON public.workspaces;

CREATE POLICY "Users can create their own workspaces" 
ON public.workspaces 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';