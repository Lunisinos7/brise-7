-- Allow invited users to delete their own invitations (to decline them)
DROP POLICY IF EXISTS "Admins can delete invitations" ON workspace_invitations;

CREATE POLICY "Admins or invited users can delete invitations" 
ON workspace_invitations 
FOR DELETE 
USING (
  is_workspace_admin(auth.uid(), workspace_id) 
  OR email = get_current_user_email()
);