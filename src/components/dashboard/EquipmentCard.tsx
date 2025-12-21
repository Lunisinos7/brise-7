import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Wind, 
  Thermometer, 
  Power, 
  Settings,
  TrendingUp,
  TrendingDown,
  Pencil
} from "lucide-react";
import { Equipment } from "@/data/mockData";

interface EquipmentCardProps {
  equipment: Equipment;
  onToggle: (id: string) => void;
  onControl: (id: string) => void;
  onEdit?: (equipment: Equipment) => void;
}

const EquipmentCard = ({ equipment, onToggle, onControl, onEdit }: EquipmentCardProps) => {
  const getModeColor = (mode: string) => {
    switch (mode) {
      case "cool":
        return "bg-cooling text-white";
      case "heat":
        return "bg-heating text-white";
      case "auto":
        return "bg-energy-efficient text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "cool":
      case "heat":
        return <Thermometer className="h-3 w-3" />;
      default:
        return <Wind className="h-3 w-3" />;
    }
  };

  const getEfficiencyTrend = (efficiency: number) => {
    if (efficiency >= 85) return { icon: TrendingUp, color: "text-energy-efficient" };
    if (efficiency >= 70) return { icon: TrendingUp, color: "text-energy-warning" };
    return { icon: TrendingDown, color: "text-energy-critical" };
  };

  const efficiencyTrend = getEfficiencyTrend(equipment.efficiency);

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-elevated h-full flex flex-col",
      equipment.isOn ? "border-cooling/30 bg-gradient-to-br from-cooling-light/5 to-transparent" : ""
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold leading-tight">{equipment.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{equipment.location}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(equipment)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <div className="flex flex-col items-center gap-1">
              <Button
                variant={equipment.isOn ? "cooling" : "outline"}
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => onToggle(equipment.id)}
              >
                <Power className="h-4 w-4" />
              </Button>
              <span className={cn(
                "text-xs font-medium",
                equipment.isOn ? "text-cooling" : "text-muted-foreground"
              )}>
                {equipment.isOn ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 flex flex-col flex-1">
        <div className="space-y-3 flex-1">
          <div>
            <p className="text-sm text-muted-foreground">Temperatura atual</p>
            <p className="text-2xl font-bold">{equipment.currentTemp}°C</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Consumo</p>
            <p className="text-xl font-bold text-cooling">{(equipment.energyConsumption / 1000).toFixed(1)} kW</p>
          </div>
        </div>

        <Button 
          variant="cooling" 
          size="default" 
          className="w-full mt-3"
          onClick={() => onControl(equipment.id)}
        >
          <Settings className="h-4 w-4" />
          Controlar
        </Button>
      </CardContent>
    </Card>
  );
};

export default EquipmentCard;