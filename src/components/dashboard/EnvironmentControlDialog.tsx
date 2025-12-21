import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Power, Minus, Plus, Snowflake, Sun, Wind, Timer, Info } from "lucide-react";
import { Equipment } from "@/hooks/useEquipments";

interface EnvironmentControlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  environmentName: string;
  equipments: Equipment[];
  onUpdateEquipments: (updates: Partial<Equipment>) => Promise<void>;
}

const EnvironmentControlDialog = ({
  isOpen,
  onClose,
  environmentName,
  equipments,
  onUpdateEquipments,
}: EnvironmentControlDialogProps) => {
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Setpoints mode state
  const [minTemp, setMinTemp] = useState(18);
  const [maxTemp, setMaxTemp] = useState(26);
  
  // Manual mode state
  const [targetTemp, setTargetTemp] = useState(21);
  const [mode, setMode] = useState<"cool" | "heat" | "fan">("cool");
  const [fanSpeed, setFanSpeed] = useState(2);
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);

  // Calculate averages from equipments
  const isAnyOn = equipments.some(eq => eq.isOn);
  const avgCurrentTemp = equipments.length > 0
    ? Math.round(equipments.reduce((sum, eq) => sum + eq.currentTemp, 0) / equipments.length)
    : 0;
  const avgTargetTemp = equipments.length > 0
    ? Math.round(equipments.reduce((sum, eq) => sum + eq.targetTemp, 0) / equipments.length)
    : 21;

  // Sync state with equipments when dialog opens
  useEffect(() => {
    if (isOpen && equipments.length > 0) {
      setTargetTemp(avgTargetTemp);
      const firstEquipment = equipments[0];
      if (firstEquipment.mode === "cool" || firstEquipment.mode === "heat" || firstEquipment.mode === "fan") {
        setMode(firstEquipment.mode);
      }
    }
  }, [isOpen, equipments, avgTargetTemp]);

  const handlePowerToggle = async () => {
    const newState = !isAnyOn;
    await onUpdateEquipments({
      isOn: newState,
      energyConsumption: newState ? 800 : 0,
    });
  };

  const handleTemperatureChange = async (newTemp: number) => {
    const clampedTemp = Math.min(30, Math.max(16, newTemp));
    setTargetTemp(clampedTemp);
    await onUpdateEquipments({ targetTemp: clampedTemp });
  };

  const handleModeChange = async (newMode: "cool" | "heat" | "fan") => {
    setMode(newMode);
    await onUpdateEquipments({ mode: newMode });
  };

  const handleSetTimer = () => {
    // Timer logic would go here - for now just show feedback
    console.log(`Timer set for ${timerHours}h ${timerMinutes}min`);
  };

  const getModeLabel = () => {
    switch (mode) {
      case "cool": return "COOL";
      case "heat": return "HEAT";
      case "fan": return "FAN";
      default: return "COOL";
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case "cool": return <Snowflake className="h-3 w-3" />;
      case "heat": return <Sun className="h-3 w-3" />;
      case "fan": return <Wind className="h-3 w-3" />;
      default: return <Snowflake className="h-3 w-3" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Controle - {environmentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-3 p-3 bg-muted/50 rounded-lg">
            <span className={cn(
              "text-sm font-medium transition-colors",
              !isManualMode ? "text-foreground" : "text-muted-foreground"
            )}>
              Modo Automático (Setpoints)
            </span>
            <Switch
              checked={isManualMode}
              onCheckedChange={setIsManualMode}
            />
            <span className={cn(
              "text-sm font-medium transition-colors",
              isManualMode ? "text-foreground" : "text-muted-foreground"
            )}>
              Modo Manual
            </span>
          </div>

          {!isManualMode ? (
            /* Setpoints Mode */
            <div className="space-y-6">
              {/* Min Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Temperatura Mínima</Label>
                  <span className="text-lg font-bold text-cooling">{minTemp}°C</span>
                </div>
                <Slider
                  value={[minTemp]}
                  onValueChange={(value) => setMinTemp(Math.min(value[0], maxTemp - 1))}
                  min={16}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Quando a temperatura cair abaixo de <strong>{minTemp}°C</strong>, equipamentos com função de aquecimento serão ativados. Equipamentos sem essa função serão desligados.
                  </p>
                </div>
              </div>

              {/* Max Temperature */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Temperatura Máxima</Label>
                  <span className="text-lg font-bold text-heating">{maxTemp}°C</span>
                </div>
                <Slider
                  value={[maxTemp]}
                  onValueChange={(value) => setMaxTemp(Math.max(value[0], minTemp + 1))}
                  min={16}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <Info className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Quando a temperatura subir acima de <strong>{maxTemp}°C</strong>, os equipamentos serão ativados para resfriar o ambiente.
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  O sistema manterá automaticamente a temperatura entre{" "}
                  <strong className="text-cooling">{minTemp}°C</strong> e{" "}
                  <strong className="text-heating">{maxTemp}°C</strong>
                </p>
              </div>
            </div>
          ) : (
            /* Manual Mode */
            <div className="space-y-6">
              {/* Status Badges */}
              <div className="flex items-center justify-center gap-2">
                <Badge variant={isAnyOn ? "default" : "secondary"}>
                  {isAnyOn ? "LIGADO" : "DESLIGADO"}
                </Badge>
                {isAnyOn && (
                  <Badge variant="outline" className="gap-1">
                    {getModeIcon()}
                    {getModeLabel()}
                  </Badge>
                )}
              </div>

              {/* Temperature Display */}
              <div className="text-center">
                <p className="text-5xl font-bold">{targetTemp}°C</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Atual: {avgCurrentTemp}°C
                </p>
              </div>

              {/* Power Button */}
              <div className="flex justify-center">
                <Button
                  variant={isAnyOn ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "h-16 w-16 rounded-full",
                    isAnyOn && "bg-cooling hover:bg-cooling/90"
                  )}
                  onClick={handlePowerToggle}
                >
                  <Power className="h-8 w-8" />
                </Button>
              </div>

              {/* Temperature Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleTemperatureChange(targetTemp - 1)}
                  disabled={!isAnyOn}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-2xl font-bold w-20 text-center">{targetTemp}°C</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleTemperatureChange(targetTemp + 1)}
                  disabled={!isAnyOn}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Mode Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={mode === "cool" ? "default" : "outline"}
                  className={cn(mode === "cool" && "bg-cooling hover:bg-cooling/90")}
                  onClick={() => handleModeChange("cool")}
                  disabled={!isAnyOn}
                >
                  <Snowflake className="h-4 w-4 mr-2" />
                  FRIO
                </Button>
                <Button
                  variant={mode === "heat" ? "default" : "outline"}
                  className={cn(mode === "heat" && "bg-heating hover:bg-heating/90")}
                  onClick={() => handleModeChange("heat")}
                  disabled={!isAnyOn}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  QUENTE
                </Button>
                <Button
                  variant={mode === "fan" ? "default" : "outline"}
                  onClick={() => handleModeChange("fan")}
                  disabled={!isAnyOn}
                >
                  <Wind className="h-4 w-4 mr-2" />
                  VENTO
                </Button>
              </div>

              {/* Fan Speed */}
              <div className="space-y-2">
                <Label className="text-sm">Velocidade do Ventilador</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((speed) => (
                    <Button
                      key={speed}
                      variant={fanSpeed === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFanSpeed(speed)}
                      disabled={!isAnyOn}
                    >
                      {speed}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Timer - Desligar em:</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={timerHours}
                    onChange={(e) => setTimerHours(Number(e.target.value))}
                    className="w-16 text-center"
                    disabled={!isAnyOn}
                  />
                  <span className="text-sm text-muted-foreground">h</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Number(e.target.value))}
                    className="w-16 text-center"
                    disabled={!isAnyOn}
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSetTimer}
                    disabled={!isAnyOn}
                  >
                    Definir
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnvironmentControlDialog;
