import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, Pencil, CalendarOff, RefreshCw, CalendarIcon, Users } from "lucide-react";
import TimeRoutineDialog from "@/components/automations/TimeRoutineDialog";
import EditTimeRoutineDialog from "@/components/automations/EditTimeRoutineDialog";
import OccupancyAutomationDialog from "@/components/automations/OccupancyAutomationDialog";
import OccupancyAutomationCard from "@/components/automations/OccupancyAutomationCard";
import { useTimeRoutines } from "@/hooks/useTimeRoutines";
import { useOccupancyAutomations } from "@/hooks/useOccupancyAutomations";
import { useEnvironments } from "@/contexts/EnvironmentContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { Switch } from "@/components/ui/switch";
import { isAfter, addDays } from "date-fns";
import { useTranslation } from "react-i18next";
const Automations = () => {
  const {
    t
  } = useTranslation();
  const {
    currentWorkspaceId
  } = useWorkspaceContext();
  const {
    routines,
    isLoading: isLoadingRoutines,
    toggleRoutine,
    deleteRoutine
  } = useTimeRoutines(currentWorkspaceId || undefined);
  const {
    automations: occupancyAutomations,
    isLoading: isLoadingOccupancy,
    toggleAutomation,
    deleteAutomation
  } = useOccupancyAutomations(currentWorkspaceId || undefined);
  const {
    environments
  } = useEnvironments();
  const daysOfWeek: Record<string, string> = {
    monday: t('automations.days.monday'),
    tuesday: t('automations.days.tuesday'),
    wednesday: t('automations.days.wednesday'),
    thursday: t('automations.days.thursday'),
    friday: t('automations.days.friday'),
    saturday: t('automations.days.saturday'),
    sunday: t('automations.days.sunday')
  };
  const getEnvironmentNames = (ids: string[]) => {
    return ids.map(id => environments.find(e => e.id === id)?.name).filter(Boolean).join(", ");
  };
  const getScheduleSummary = (schedules: {
    day_of_week: string;
    start_time: string;
    end_time: string;
  }[]) => {
    const dayGroups = schedules.reduce((acc, s) => {
      if (!acc[s.day_of_week]) acc[s.day_of_week] = [];
      acc[s.day_of_week].push(`${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`);
      return acc;
    }, {} as Record<string, string[]>);
    return Object.entries(dayGroups).map(([day, times]) => `${daysOfWeek[day]}: ${times.join(", ")}`).join(" | ");
  };
  const getUpcomingExceptions = (exceptions: typeof routines[0]['exceptions']) => {
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);
    return exceptions.filter(e => {
      const excDate = new Date(e.exception_date + 'T12:00:00');
      return isAfter(excDate, now) && !isAfter(excDate, sevenDaysFromNow);
    });
  };
  const activeRoutinesCount = routines.filter(r => r.is_active).length;
  const inactiveRoutinesCount = routines.filter(r => !r.is_active).length;
  const activeOccupancyCount = occupancyAutomations.filter(a => a.is_active).length;
  const inactiveOccupancyCount = occupancyAutomations.filter(a => !a.is_active).length;
  const isLoading = isLoadingRoutines || isLoadingOccupancy;
  return <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-cooling bg-clip-text text-transparent">
            {t('automations.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('automations.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <OccupancyAutomationDialog>
            <Button variant="control" className="gap-2 bg-primary">
              <Users className="h-4 w-4" />
              {t('automations.newOccupancyAutomation')}
            </Button>
          </OccupancyAutomationDialog>
          <TimeRoutineDialog>
            <Button variant="control" className="gap-2 bg-primary">
              <Clock className="h-4 w-4" />
              {t('automations.newTimeRoutine')}
            </Button>
          </TimeRoutineDialog>
        </div>
      </div>

      {/* Occupancy Automations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{t('automations.occupancyAutomations')}</h2>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {activeOccupancyCount} {activeOccupancyCount !== 1 ? t('automations.actives') : t('automations.active')}
            </Badge>
            <Badge variant="outline">
              {inactiveOccupancyCount} {inactiveOccupancyCount !== 1 ? t('automations.inactives') : t('automations.inactive')}
            </Badge>
          </div>
        </div>

        {isLoadingOccupancy ? <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div> : occupancyAutomations.length === 0 ? <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {t('automations.noOccupancyAutomations')}
            </p>
          </Card> : <div className="grid gap-4">
            {occupancyAutomations.map(automation => <OccupancyAutomationCard key={automation.id} automation={automation} onToggle={(id, isActive) => toggleAutomation.mutate({
          id,
          is_active: isActive
        })} onDelete={id => deleteAutomation.mutate(id)} />)}
          </div>}
      </div>

      {/* Time Routines Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{t('automations.timeRoutines')}</h2>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {activeRoutinesCount} {activeRoutinesCount !== 1 ? t('automations.actives') : t('automations.active')}
            </Badge>
            <Badge variant="outline">
              {inactiveRoutinesCount} {inactiveRoutinesCount !== 1 ? t('automations.inactives') : t('automations.inactive')}
            </Badge>
          </div>
        </div>

        {isLoadingRoutines ? <div className="text-center py-8 text-muted-foreground">{t('automations.loadingRoutines')}</div> : routines.length === 0 ? <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {t('automations.noTimeRoutines')}
            </p>
          </Card> : <div className="grid gap-4">
            {routines.map(routine => <Card key={routine.id} className="hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      
                      <div>
                        <CardTitle className="text-lg">{routine.name}</CardTitle>
                        <CardDescription>
                          {getScheduleSummary(routine.schedules)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={routine.is_active} onCheckedChange={checked => toggleRoutine.mutate({
                  id: routine.id,
                  is_active: checked
                })} />
                      <Badge variant={routine.is_active ? "default" : "secondary"} className={routine.is_active ? "bg-primary text-primary-foreground" : ""}>
                        {routine.is_active ? t('automations.active') : t('automations.inactive')}
                      </Badge>
                      <EditTimeRoutineDialog routine={routine}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </EditTimeRoutineDialog>
                      <Button variant="ghost" size="icon" onClick={() => deleteRoutine.mutate(routine.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t('automations.trigger')}</p>
                      <p className="font-medium">{t('automations.schedule')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('automations.environments')}</p>
                      <p className="font-medium">
                        {getEnvironmentNames(routine.environment_ids) || t('common.none')}
                      </p>
                    </div>
                  </div>

                  {/* Exceptions info */}
                  {routine.exceptions && routine.exceptions.length > 0 && <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CalendarOff className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{t('automations.exceptions')}:</span>
                        
                        {routine.exceptions.filter(e => e.is_recurring).length > 0 && <Badge variant="outline" className="text-xs">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {routine.exceptions.filter(e => e.is_recurring).length} {t('automations.annual')}
                          </Badge>}
                        
                        {routine.exceptions.filter(e => !e.is_recurring).length > 0 && <Badge variant="outline" className="text-xs">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {routine.exceptions.filter(e => !e.is_recurring).length} {t('automations.punctual')}
                          </Badge>}

                        {getUpcomingExceptions(routine.exceptions).length > 0 && <Badge className="bg-warning/10 text-warning text-xs">
                            {getUpcomingExceptions(routine.exceptions).length} {t('automations.next7Days')}
                          </Badge>}
                      </div>
                    </div>}
                </CardContent>
              </Card>)}
          </div>}
      </div>
    </div>;
};
export default Automations;