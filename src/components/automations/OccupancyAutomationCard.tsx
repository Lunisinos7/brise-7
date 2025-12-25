import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Users, Pencil, Trash2, Clock, RefreshCw, Calendar } from "lucide-react";
import { OccupancyAutomation } from "@/hooks/useOccupancyAutomations";
import EditOccupancyAutomationDialog from "./EditOccupancyAutomationDialog";
import { useTranslation } from "react-i18next";

interface OccupancyAutomationCardProps {
  automation: OccupancyAutomation;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const OccupancyAutomationCard = ({ automation, onToggle, onDelete }: OccupancyAutomationCardProps) => {
  const { t } = useTranslation();

  const environmentNames = automation.environments.map((e) => e.name).join(", ");
  const totalSensors = automation.environments.reduce(
    (acc, env) => acc + env.equipment_ids.length,
    0
  );

  return (
    <Card className="hover:shadow-elevated transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg">{automation.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {t("automations.occupancy.turnsOffAfter", {
                  minutes: automation.inactivity_timeout_minutes,
                })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={automation.is_active}
              onCheckedChange={(checked) => onToggle(automation.id, checked)}
            />
            <Badge
              variant={automation.is_active ? "default" : "secondary"}
              className={automation.is_active ? "bg-energy-efficient text-white" : ""}
            >
              {automation.is_active ? t("automations.active") : t("automations.inactive")}
            </Badge>
            <EditOccupancyAutomationDialog automation={automation}>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </EditOccupancyAutomationDialog>
            <Button variant="ghost" size="icon" onClick={() => onDelete(automation.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t("automations.occupancy.trigger")}</p>
            <p className="font-medium">{t("automations.occupancy.triggerType")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("automations.environments")}</p>
            <p className="font-medium">
              {environmentNames || t("common.none")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("automations.occupancy.sensorsLabel")}</p>
            <p className="font-medium">{totalSensors}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {automation.reactivation_enabled && (
              <Badge variant="outline" className="text-xs gap-1">
                <RefreshCw className="h-3 w-3" />
                {t("automations.occupancy.reactivationBadge")}
              </Badge>
            )}
            {automation.respect_time_routines && (
              <Badge variant="outline" className="text-xs gap-1">
                <Calendar className="h-3 w-3" />
                {t("automations.occupancy.respectRoutinesBadge")}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OccupancyAutomationCard;
