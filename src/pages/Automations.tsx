import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, Plus, Pencil } from "lucide-react";
import TimeRoutineDialog from "@/components/automations/TimeRoutineDialog";
import EditTimeRoutineDialog from "@/components/automations/EditTimeRoutineDialog";
import { useTimeRoutines } from "@/hooks/useTimeRoutines";
import { useEnvironments } from "@/contexts/EnvironmentContext";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { Switch } from "@/components/ui/switch";
const Automations = () => {
  const {
    currentWorkspaceId
  } = useWorkspaceContext();
  const {
    routines,
    isLoading,
    toggleRoutine,
    deleteRoutine
  } = useTimeRoutines(currentWorkspaceId || undefined);
  const {
    environments
  } = useEnvironments();
  const daysOfWeek: Record<string, string> = {
    monday: "Seg",
    tuesday: "Ter",
    wednesday: "Qua",
    thursday: "Qui",
    friday: "Sex",
    saturday: "Sáb",
    sunday: "Dom"
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
  const activeCount = routines.filter(r => r.is_active).length;
  const inactiveCount = routines.filter(r => !r.is_active).length;
  return <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-cooling bg-clip-text text-transparent">
            Automações
          </h1>
          <p className="text-muted-foreground">
            Crie e gerencie automações inteligentes para seus equipamentos
          </p>
        </div>
        <TimeRoutineDialog>
          <Button variant="control" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Automação 
          </Button>
        </TimeRoutineDialog>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Automações Configuradas</h2>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-energy-efficient/10 text-energy-efficient">
              {activeCount} Ativa{activeCount !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline">{inactiveCount} Inativa{inactiveCount !== 1 ? "s" : ""}</Badge>
          </div>
        </div>

        {isLoading ? <div className="text-center py-8 text-muted-foreground">Carregando rotinas...</div> : routines.length === 0 ? <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma rotina configurada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira rotina por horário para automatizar seus equipamentos.
              </p>
              <TimeRoutineDialog>
                <Button variant="control" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Rotina por Horário
                </Button>
              </TimeRoutineDialog>
            </CardContent>
          </Card> : <div className="grid gap-4">
            {routines.map(routine => <Card key={routine.id} className="hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-cooling/10">
                        <Clock className="h-5 w-5 text-cooling" />
                      </div>
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
                      <Badge variant={routine.is_active ? "default" : "secondary"} className={routine.is_active ? "bg-energy-efficient text-white" : ""}>
                        {routine.is_active ? "Ativa" : "Inativa"}
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
                      <p className="text-muted-foreground">Gatilho</p>
                      <p className="font-medium">Horário</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ambientes</p>
                      <p className="font-medium">
                        {getEnvironmentNames(routine.environment_ids) || "Nenhum"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>
    </div>;
};
export default Automations;