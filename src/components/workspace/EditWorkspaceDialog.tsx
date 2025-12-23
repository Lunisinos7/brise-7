import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Workspace } from "@/hooks/useWorkspaces";
import { useTranslation } from "react-i18next";

interface EditWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  isOwner: boolean;
  workspacesCount: number;
  onUpdate: (data: { id: string; name: string }) => void;
  onDelete: (id: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

const EditWorkspaceDialog = ({
  open,
  onOpenChange,
  workspace,
  isOwner,
  workspacesCount,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: EditWorkspaceDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState(workspace.name);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const canDelete = isOwner && workspacesCount > 1;
  const isConfirmNameValid = confirmName === workspace.name;

  const handleSave = () => {
    if (name.trim() && name !== workspace.name) {
      onUpdate({ id: workspace.id, name: name.trim() });
    }
  };

  const handleDelete = () => {
    if (isConfirmNameValid) {
      onDelete(workspace.id);
      setDeleteDialogOpen(false);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName(workspace.name);
      setConfirmName("");
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('workspace.settings')}</DialogTitle>
            <DialogDescription>
              {t('workspace.settingsDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">{t('workspace.name')}</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('workspace.namePlaceholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isUpdating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || name === workspace.name || isUpdating}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.saveChanges')}
            </Button>
          </DialogFooter>

          {isOwner && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium text-sm">{t('workspace.dangerZone')}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('workspace.dangerZoneDesc')}
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={!canDelete}
                  className="w-full"
                >
                  {t('workspace.delete')}
                </Button>
                {!canDelete && workspacesCount <= 1 && (
                  <p className="text-xs text-muted-foreground text-center">
                    {t('workspace.needAtLeastOne')}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workspace.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                {t('workspace.deleteConfirmDesc')}
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{t('workspace.deleteItems.equipments')}</li>
                <li>{t('workspace.deleteItems.environments')}</li>
                <li>{t('workspace.deleteItems.routines')}</li>
                <li>{t('workspace.deleteItems.history')}</li>
                <li>{t('workspace.deleteItems.members')}</li>
              </ul>
              <div className="pt-2">
                <Label htmlFor="confirm-name" className="text-foreground">
                  {t('workspace.typeNameToConfirm', { name: workspace.name })}
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={workspace.name}
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmName("")}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!isConfirmNameValid || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('workspace.deletePermanently')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditWorkspaceDialog;
