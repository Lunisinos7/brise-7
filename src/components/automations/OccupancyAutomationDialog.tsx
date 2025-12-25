import { useState } from "react";
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
import { useOccupancyAutomations } from "@/hooks/useOccupancyAutomations";
import { useEnvironments } from "@/contexts/EnvironmentContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useTranslation } from "react-i18next";
import { Users, Clock, RefreshCw, Calendar } from "lucide-react";

interface OccupancyAutomationDialogProps {
  children: React.ReactNode;
}

const OccupancyAutomationDialog = ({ children }: OccupancyAutomationDialogProps) => {
  const { t } = useTranslation();
  const { currentWorkspaceId } = useWorkspaceContext();
  const { addAutomation } = useOccupancyAutomations(currentWorkspaceId || undefined);
  const { environments } = useEnvironments();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [inactivityTimeout, setInactivityTimeout] = useState(15);
  const [reactivationEnabled, setReactivationEnabled] = useState(true);
  const [respectTimeRoutines, setRespectTimeRoutines] = useState(true);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!currentWorkspaceId || !name.trim() || selectedEnvironments.length === 0) return;

    await addAutomation.mutateAsync({
      name: name.trim(),
      workspaceId: currentWorkspaceId,
      inactivityTimeoutMinutes: inactivityTimeout,
      reactivationEnabled,
      respectTimeRoutines,
      environmentIds: selectedEnvironments,
    });

    // Reset form
    setName("");
    setInactivityTimeout(15);
    setReactivationEnabled(true);
    setRespectTimeRoutines(true);
    setSelectedEnvironments([]);
    setOpen(false);
  };

  const toggleEnvironment = (envId: string) => {
    setSelectedEnvironments((prev) =>
      prev.includes(envId) ? prev.filter((id) => id !== envId) : [...prev, envId]
    );
  };

  // Count sensors (BRISE equipment) per environment
  const getSensorCount = (equipmentIds: string[]) => {
    // For now, count all equipment as potential sensors
    // In the future, filter by BRISE equipment type
    return equipmentIds.length;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cooling" />
            {t("automations.occupancy.dialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("automations.occupancy.dialogDescription")}
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
                          id={`env-${env.id}`}
                          checked={selectedEnvironments.includes(env.id)}
                          onCheckedChange={() => toggleEnvironment(env.id)}
                        />
                        <label
                          htmlFor={`env-${env.id}`}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || selectedEnvironments.length === 0 || addAutomation.isPending}
          >
            {addAutomation.isPending ? t("common.creating") : t("automations.occupancy.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OccupancyAutomationDialog;
