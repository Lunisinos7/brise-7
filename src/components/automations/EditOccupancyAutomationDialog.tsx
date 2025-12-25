import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useOccupancyAutomations, OccupancyAutomation } from "@/hooks/useOccupancyAutomations";
import { useEnvironments } from "@/contexts/EnvironmentContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useTranslation } from "react-i18next";
import { Users, Clock, RefreshCw, Calendar, Trash2 } from "lucide-react";
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

interface EditOccupancyAutomationDialogProps {
  automation: OccupancyAutomation;
  children: React.ReactNode;
}

const EditOccupancyAutomationDialog = ({ automation, children }: EditOccupancyAutomationDialogProps) => {
  const { t } = useTranslation();
  const { currentWorkspaceId } = useWorkspaceContext();
  const { updateAutomation, deleteAutomation } = useOccupancyAutomations(currentWorkspaceId || undefined);
  const { environments } = useEnvironments();

  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [name, setName] = useState(automation.name);
  const [inactivityTimeout, setInactivityTimeout] = useState(automation.inactivity_timeout_minutes);
  const [reactivationEnabled, setReactivationEnabled] = useState(automation.reactivation_enabled);
  const [respectTimeRoutines, setRespectTimeRoutines] = useState(automation.respect_time_routines);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(
    automation.environments.map((e) => e.id)
  );

  useEffect(() => {
    if (open) {
      setName(automation.name);
      setInactivityTimeout(automation.inactivity_timeout_minutes);
      setReactivationEnabled(automation.reactivation_enabled);
      setRespectTimeRoutines(automation.respect_time_routines);
      setSelectedEnvironments(automation.environments.map((e) => e.id));
    }
  }, [open, automation]);

  const handleSubmit = async () => {
    if (!currentWorkspaceId || !name.trim() || selectedEnvironments.length === 0) return;

    await updateAutomation.mutateAsync({
      id: automation.id,
      name: name.trim(),
      workspaceId: currentWorkspaceId,
      inactivityTimeoutMinutes: inactivityTimeout,
      reactivationEnabled,
      respectTimeRoutines,
      environmentIds: selectedEnvironments,
    });

    setOpen(false);
  };

  const handleDelete = async () => {
    await deleteAutomation.mutateAsync(automation.id);
    setShowDeleteConfirm(false);
    setOpen(false);
  };

  const toggleEnvironment = (envId: string) => {
    setSelectedEnvironments((prev) =>
      prev.includes(envId) ? prev.filter((id) => id !== envId) : [...prev, envId]
    );
  };

  const getSensorCount = (equipmentIds: string[]) => {
    return equipmentIds.length;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cooling" />
              {t("automations.occupancy.editTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("automations.occupancy.editDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("automations.occupancy.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("automations.occupancy.namePlaceholder")}
              />
            </div>

            {/* Inactivity Timeout */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label>{t("automations.occupancy.inactivityTimeout")}</Label>
              </div>
              <div className="px-2">
                <Slider
                  value={[inactivityTimeout]}
                  onValueChange={(value) => setInactivityTimeout(value[0])}
                  min={5}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5 min</span>
                  <span className="font-medium text-foreground">
                    {inactivityTimeout} {t("automations.occupancy.minutes")}
                  </span>
                  <span>60 min</span>
                </div>
              </div>
            </div>

            {/* Reactivation */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium">
                    {t("automations.occupancy.reactivation")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("automations.occupancy.reactivationDesc")}
                  </p>
                </div>
              </div>
              <Switch
                checked={reactivationEnabled}
                onCheckedChange={setReactivationEnabled}
              />
            </div>

            {/* Respect Time Routines */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="font-medium">
                    {t("automations.occupancy.respectTimeRoutines")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("automations.occupancy.respectTimeRoutinesDesc")}
                  </p>
                </div>
              </div>
              <Switch
                checked={respectTimeRoutines}
                onCheckedChange={setRespectTimeRoutines}
              />
            </div>

            {/* Environments */}
            <div className="space-y-3">
              <Label>{t("automations.occupancy.environments")}</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {environments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {t("automations.occupancy.noEnvironments")}
                  </p>
                ) : (
                  environments.map((env) => {
                    const sensorCount = getSensorCount(env.equipmentIds);
                    return (
                      <div
                        key={env.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`env-edit-${env.id}`}
                            checked={selectedEnvironments.includes(env.id)}
                            onCheckedChange={() => toggleEnvironment(env.id)}
                          />
                          <label
                            htmlFor={`env-edit-${env.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {env.name}
                          </label>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {sensorCount} {t("automations.occupancy.sensors", { count: sensorCount })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              {selectedEnvironments.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedEnvironments.length} {t("automations.occupancy.environmentsSelected")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("common.delete")}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || selectedEnvironments.length === 0 || updateAutomation.isPending}
              >
                {updateAutomation.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("automations.occupancy.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("automations.occupancy.deleteDescription", { name: automation.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditOccupancyAutomationDialog;
