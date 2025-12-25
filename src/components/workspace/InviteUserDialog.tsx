import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useWorkspaceInvitations, WorkspaceRole } from "@/hooks/useWorkspaces";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InviteUserDialog = ({ open, onOpenChange }: InviteUserDialogProps) => {
  const { t, i18n } = useTranslation();
  
  const roleOptions: { value: WorkspaceRole; label: string; description: string }[] = [
    { value: 'viewer', label: t('workspace.roles.viewer'), description: t('workspace.roles.viewerDesc') },
    { value: 'admin', label: t('workspace.roles.admin'), description: t('workspace.roles.adminDesc') },
    { value: 'owner', label: t('workspace.roles.owner'), description: t('workspace.roles.ownerDesc') },
  ];
  const { user } = useAuthContext();
  const { currentWorkspaceId, currentWorkspace } = useWorkspaceContext();
  const { createInvitation, isCreating } = useWorkspaceInvitations(currentWorkspaceId);
  
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("viewer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user?.id) return;

    // Get current workspace name and inviter name for the email
    const inviterName = user.user_metadata?.full_name || user.email || 'Um usuário';
    const currentLanguage = i18n.language || 'pt-BR';

    createInvitation(
      { 
        email: email.trim(), 
        role, 
        invitedBy: user.id,
        inviterName,
        workspaceName: currentWorkspace?.name,
        language: currentLanguage,
      },
      {
        onSuccess: () => {
          setEmail("");
          setRole("viewer");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('workspace.inviteUser')}
          </DialogTitle>
          <DialogDescription>
            {t('workspace.inviteDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('workspace.inviteEmail')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('workspace.inviteEmailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t('workspace.accessType')}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as WorkspaceRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isCreating || !email.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.sending')}
                </>
              ) : (
                t('workspace.sendInvite')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
