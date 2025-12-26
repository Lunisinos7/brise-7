import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Building2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAuthContext } from "@/contexts/AuthContext";
import CreateWorkspaceDialog from "./CreateWorkspaceDialog";
import EditWorkspaceDialog from "./EditWorkspaceDialog";
import { useTranslation } from "react-i18next";
const WorkspaceSelector = () => {
  const {
    t
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspaceId,
    isLoading,
    isWorkspaceOwner
  } = useWorkspaceContext();
  const {
    user
  } = useAuthContext();
  const {
    updateWorkspace,
    deleteWorkspace,
    isUpdating,
    isDeleting
  } = useWorkspaces(user?.id);
  const handleDeleteWorkspace = (id: string) => {
    deleteWorkspace(id);
    // The context will auto-select another workspace
  };
  if (isLoading) {
    return <div className="w-full h-10 bg-muted/50 rounded-lg animate-pulse" />;
  }
  return <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto py-2 px-3">
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <div className="h-8 w-8 rounded-md bg-gradient-cooling flex items-center justify-center flex-shrink-0 bg-primary">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col items-start min-w-0 overflow-hidden">
                <span className="text-xs text-muted-foreground">{t('workspace.label')}</span>
                <span className="font-medium truncate w-full">
                  {currentWorkspace?.name || t('workspace.select')}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <Command>
            <CommandInput placeholder={t('workspace.searchPlaceholder')} />
            <CommandList>
              <CommandEmpty>{t('workspace.noResults')}</CommandEmpty>
              <CommandGroup heading={t('workspace.yourWorkspaces')}>
                {workspaces.map(workspace => <CommandItem key={workspace.id} value={workspace.name} onSelect={() => {
                setCurrentWorkspaceId(workspace.id);
                setOpen(false);
              }}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0 bg-primary">
                        <Building2 className="h-3 w-3" />
                      </div>
                      <span className="truncate">{workspace.name}</span>
                    </div>
                    <Check className={cn("ml-auto h-4 w-4 flex-shrink-0", currentWorkspace?.id === workspace.id ? "opacity-100" : "opacity-0")} />
                  </CommandItem>)}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={() => {
                setOpen(false);
                setCreateDialogOpen(true);
              }} className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('workspace.create')}
                </CommandItem>
                {currentWorkspace && isWorkspaceOwner && <CommandItem onSelect={() => {
                setOpen(false);
                setEditDialogOpen(true);
              }} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('workspace.settings')}
                  </CommandItem>}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateWorkspaceDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {currentWorkspace && <EditWorkspaceDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} workspace={currentWorkspace} isOwner={isWorkspaceOwner} workspacesCount={workspaces.length} onUpdate={updateWorkspace} onDelete={handleDeleteWorkspace} isUpdating={isUpdating} isDeleting={isDeleting} />}
    </>;
};
export default WorkspaceSelector;