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
import { Power, Minus, Plus, Snowflake, Sun, Wind, Timer, Info, Thermometer } from "lucide-react";
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
  
  // Setpoints mode state - Opção C: configurações separadas para aquecimento e refrigeração
  const [coolTriggerTemp, setCoolTriggerTemp] = useState(28);
  const [coolTargetTemp, setCoolTargetTemp] = useState(24);
  const [heatTriggerTemp, setHeatTriggerTemp] = useState(18);
  const [heatTargetTemp, setHeatTargetTemp] = useState(22);
  
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
    const clampedTemp = Math.min(50, Math.max(-30, newTemp));
    setTargetTemp(clampedTemp);
    await onUpdateEquipments({ targetTemp: clampedTemp });
  };

  const handleModeChange = async (newMode: "cool" | "heat" | "fan") => {
    setMode(newMode);
    await onUpdateEquipments({ mode: newMode });
  };

  const handleSetTimer = () => {
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

  // Validações para evitar configurações inválidas
  const handleCoolTriggerChange = (value: number[]) => {
    const newValue = value[0];
    // Cool trigger deve ser maior que heat target (zona de conforto)
    if (newValue > heatTargetTemp) {
      setCoolTriggerTemp(newValue);
      // Ajustar cool target se necessário
      if (coolTargetTemp >= newValue) {
        setCoolTargetTemp(newValue - 1);
      }
    }
  };

  const handleCoolTargetChange = (value: number[]) => {
    const newValue = value[0];
    // Cool target deve ser menor que cool trigger e maior ou igual a heat target
    if (newValue < coolTriggerTemp && newValue >= heatTargetTemp) {
      setCoolTargetTemp(newValue);
    }
  };

  const handleHeatTriggerChange = (value: number[]) => {
    const newValue = value[0];
    // Heat trigger deve ser menor que cool target (zona de conforto)
    if (newValue < coolTargetTemp) {
      setHeatTriggerTemp(newValue);
      // Ajustar heat target se necessário
      if (heatTargetTemp <= newValue) {
        setHeatTargetTemp(newValue + 1);
      }
    }
  };

  const handleHeatTargetChange = (value: number[]) => {
    const newValue = value[0];
    // Heat target deve ser maior que heat trigger e menor ou igual a cool target
    if (newValue > heatTriggerTemp && newValue <= coolTargetTemp) {
      setHeatTargetTemp(newValue);
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
              Modo Automático
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
            /* Setpoints Mode - Opção C */
            <div className="space-y-5">
              {/* Refrigeração */}
              <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 space-y-4">
                <div className="flex items-center gap-2">
                  <Snowflake className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">Refrigeração</h3>
                </div>
                
                {/* Cool Trigger */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Ligar quando acima de:</Label>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{coolTriggerTemp}°C</span>
                  </div>
                  <Slider
                    value={[coolTriggerTemp]}
                    onValueChange={handleCoolTriggerChange}
                    min={-30}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Cool Target */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Resfriar até:</Label>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{coolTargetTemp}°C</span>
                  </div>
                  <Slider
                    value={[coolTargetTemp]}
                    onValueChange={handleCoolTargetChange}
                    min={-30}
                    max={coolTriggerTemp - 1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Aquecimento */}
              <div className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 space-y-4">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-orange-700 dark:text-orange-300">Aquecimento</h3>
                </div>
                
                {/* Heat Trigger */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Ligar quando abaixo de:</Label>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{heatTriggerTemp}°C</span>
                  </div>
                  <Slider
                    value={[heatTriggerTemp]}
                    onValueChange={handleHeatTriggerChange}
                    min={-30}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Heat Target */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Aquecer até:</Label>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{heatTargetTemp}°C</span>
                  </div>
                  <Slider
                    value={[heatTargetTemp]}
                    onValueChange={handleHeatTargetChange}
                    min={heatTriggerTemp + 1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Zona de Conforto */}
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-700 dark:text-green-300">Zona de Conforto</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Entre <strong>{heatTargetTemp}°C</strong> e <strong>{coolTargetTemp}°C</strong>, os equipamentos permanecerão desligados.
                </p>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  O sistema ativará automaticamente o modo apropriado (aquecimento ou refrigeração) com base na temperatura atual do ambiente.
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
