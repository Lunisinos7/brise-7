import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
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
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateWorkspaceDialog = ({ open, onOpenChange }: CreateWorkspaceDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const { user } = useAuthContext();
  const { createWorkspace, isCreating } = useWorkspaces(user?.id);
  const { setCurrentWorkspaceId } = useWorkspaceContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !user?.id) return;

    createWorkspace(
      { name: name.trim() },
      {
        onSuccess: (newWorkspace) => {
          setCurrentWorkspaceId(newWorkspace.id);
          setName("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-cooling flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>{t('workspace.createTitle')}</DialogTitle>
              <DialogDescription>
                {t('workspace.createDesc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('workspace.name')}</Label>
              <Input
                id="name"
                placeholder={t('workspace.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="cooling"
              disabled={!name.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.creating')}
                </>
              ) : (
                t('workspace.createButton')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceDialog;
