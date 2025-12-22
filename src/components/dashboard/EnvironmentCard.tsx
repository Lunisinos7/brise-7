import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MapPin, Wind, Sliders, MoreVertical, Pencil, Trash2, Settings2, Zap } from "lucide-react";
import { Equipment } from "@/hooks/useEquipments";
import { Environment } from "@/contexts/EnvironmentContext";
interface EnvironmentCardProps {
  environment: Environment;
  equipments: Equipment[];
  onControlEnvironment?: (environmentId: string) => void;
  onEditEnvironment?: (environmentId: string) => void;
  onDeleteEnvironment?: (environmentId: string) => void;
  onToggleEnvironment?: (environmentId: string, isActive: boolean) => void;
}
const EnvironmentCard = ({
  environment,
  equipments,
  onControlEnvironment,
  onEditEnvironment,
  onDeleteEnvironment,
  onToggleEnvironment
}: EnvironmentCardProps) => {
  const linkedEquipments = equipments.filter(eq => environment.equipmentIds.includes(eq.id));
  const activeCount = linkedEquipments.filter(eq => eq.isOn).length;
  const avgTemp = linkedEquipments.length > 0 ? Math.round(linkedEquipments.reduce((sum, eq) => sum + eq.currentTemp, 0) / linkedEquipments.length) : 0;
  const totalConsumption = linkedEquipments.reduce((sum, eq) => sum + eq.energyConsumption, 0);
  const isActive = environment.isActive;
  return <Card className={cn("transition-all duration-300 hover:shadow-elevated h-full flex flex-col", !isActive && "opacity-60", isActive && activeCount > 0 ? "border-cooling/30 bg-gradient-to-br from-cooling-light/5 to-transparent" : "")}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold leading-tight flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {environment.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {linkedEquipments.length} equipamento(s)
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={!isActive ? "outline" : activeCount > 0 ? "default" : "secondary"} className="shrink-0">
              {!isActive ? "⏸️ Pausado" : `${activeCount}/${linkedEquipments.length} ativos`}
            </Badge>
            <Switch checked={isActive} onCheckedChange={checked => onToggleEnvironment?.(environment.id, checked)} className="ml-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Opções</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => onEditEnvironment?.(environment.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeleteEnvironment?.(environment.id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 flex flex-col flex-1">
        <div className="flex-1">
          {/* Stats row */}
          <div className="gap-6 mb-3 flex items-start justify-start">
            <div>
              <p className="text-xs text-muted-foreground">Temp. média</p>
              <p className="text-xl font-bold">{avgTemp > 0 ? `${avgTemp}°C` : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Consumo</p>
              <p className="text-xl font-bold text-cooling">{(totalConsumption / 1000).toFixed(1)} kW</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Modo</p>
              <p className="text-muted-foreground/60 flex items-center gap-1 font-normal text-xl">
                {environment.isAutomatic ? <>
                    <Zap className="h-4 w-4" />
                    Auto
                  </> : <>
                    <Settings2 className="h-4 w-4" />
                    Manual
                  </>}
              </p>
            </div>
          </div>

          {/* Equipments */}
          {linkedEquipments.length > 0 && <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Equipamentos:</p>
              <div className="flex flex-wrap gap-1">
                {linkedEquipments.slice(0, 4).map(eq => <Badge key={eq.id} variant="outline" className="text-xs">
                    <Wind className="h-3 w-3 mr-1" />
                    {eq.model.split(" ")[0]}
                  </Badge>)}
                {linkedEquipments.length > 4 && <Badge variant="outline" className="text-xs">
                    +{linkedEquipments.length - 4}
                  </Badge>}
              </div>
            </div>}
        </div>

        {/* Control Button */}
        {linkedEquipments.length > 0 && onControlEnvironment && <div className="pt-3 mt-3 border-t">
            <Button variant="outline" size="sm" className="w-full" onClick={() => onControlEnvironment(environment.id)} disabled={!isActive}>
              <Sliders className="h-4 w-4 mr-2" />
              Controlar
            </Button>
          </div>}
      </CardContent>
    </Card>;
};
export default EnvironmentCard;