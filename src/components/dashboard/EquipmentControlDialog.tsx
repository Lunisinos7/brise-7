import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Power,
  Snowflake,
  Sun,
  Wind,
  Thermometer,
  Timer,
  Minus,
  Plus,
  Clock,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  name: string;
  location: string;
  isOn: boolean;
  currentTemp: number;
  targetTemp: number;
  mode: string;
  energyConsumption: number;
  efficiency: number;
}

interface EquipmentControlDialogProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Equipment>) => void;
}

const EquipmentControlDialog = ({
  equipment,
  isOpen,
  onClose,
  onUpdate,
}: EquipmentControlDialogProps) => {
  const { toast } = useToast();
  const [localTemp, setLocalTemp] = useState(equipment?.targetTemp || 22);
  const [localMode, setLocalMode] = useState(equipment?.mode || "cool");
  const [fanSpeed, setFanSpeed] = useState(2);
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [isManualMode, setIsManualMode] = useState(true);

  // Setpoints - Opção C: configurações separadas
  const [coolTriggerTemp, setCoolTriggerTemp] = useState(28);
  const [coolTargetTemp, setCoolTargetTemp] = useState(24);
  const [heatTriggerTemp, setHeatTriggerTemp] = useState(18);
  const [heatTargetTemp, setHeatTargetTemp] = useState(22);

  useEffect(() => {
    setLocalTemp(equipment?.targetTemp || 22);
    setLocalMode(equipment?.mode || "cool");
  }, [equipment?.id]);

  if (!equipment) return null;

  const handlePowerToggle = () => {
    const newState = !equipment.isOn;
    onUpdate(equipment.id, { isOn: newState });
    toast({
      title: newState ? "Equipamento Ligado" : "Equipamento Desligado",
      description: `${equipment.name} foi ${newState ? "ligado" : "desligado"}`,
    });
  };

  const handleTempChange = (increment: boolean) => {
    const newTemp = increment ? localTemp + 1 : localTemp - 1;
    if (newTemp >= -30 && newTemp <= 50) {
      setLocalTemp(newTemp);
      onUpdate(equipment.id, { targetTemp: newTemp });
    }
  };

  const handleModeChange = (mode: string) => {
    setLocalMode(mode);
    onUpdate(equipment.id, { mode });
    toast({
      title: "Modo Alterado",
      description: `Modo alterado para ${mode === "cool" ? "Refrigerar" : mode === "heat" ? "Aquecer" : "Ventilação"}`,
    });
  };

  const handleTimerSet = () => {
    if (timerHours > 0 || timerMinutes > 0) {
      setTimerEnabled(true);
      toast({
        title: "Timer Configurado",
        description: `O equipamento será desligado em ${timerHours}h ${timerMinutes}min`,
      });
    }
  };

  const handleTimerCancel = () => {
    setTimerEnabled(false);
    setTimerHours(0);
    setTimerMinutes(0);
    toast({
      title: "Timer Cancelado",
      description: "O timer foi desativado",
    });
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "cool":
        return <Snowflake className="h-4 w-4" />;
      case "heat":
        return <Sun className="h-4 w-4" />;
      default:
        return <Wind className="h-4 w-4" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "cool":
        return "secondary";
      case "heat":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Validações para setpoints
  const handleCoolTriggerChange = (value: number[]) => {
    const newValue = value[0];
    if (newValue > heatTargetTemp) {
      setCoolTriggerTemp(newValue);
      if (coolTargetTemp >= newValue) {
        setCoolTargetTemp(newValue - 1);
      }
    }
  };

  const handleCoolTargetChange = (value: number[]) => {
    const newValue = value[0];
    if (newValue < coolTriggerTemp && newValue >= heatTargetTemp) {
      setCoolTargetTemp(newValue);
    }
  };

  const handleHeatTriggerChange = (value: number[]) => {
    const newValue = value[0];
    if (newValue < coolTargetTemp) {
      setHeatTriggerTemp(newValue);
      if (heatTargetTemp <= newValue) {
        setHeatTargetTemp(newValue + 1);
      }
    }
  };

  const handleHeatTargetChange = (value: number[]) => {
    const newValue = value[0];
    if (newValue > heatTriggerTemp && newValue <= coolTargetTemp) {
      setHeatTargetTemp(newValue);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Controle - {equipment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Label className={`text-sm ${!isManualMode ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              Automático
            </Label>
            <Switch
              checked={isManualMode}
              onCheckedChange={setIsManualMode}
            />
            <Label className={`text-sm ${isManualMode ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              Manual
            </Label>
          </div>

          {isManualMode ? (
            /* Remote Control Interface */
            <div className="bg-gradient-to-b from-muted/50 to-muted rounded-2xl p-4 space-y-4">
              {/* Status Display */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={equipment.isOn ? "default" : "secondary"}>
                    {equipment.isOn ? "LIGADO" : "DESLIGADO"}
                  </Badge>
                  <Badge variant={getModeColor(localMode)}>
                    {getModeIcon(localMode)}
                    {localMode.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {localTemp}°C
                </div>
                <div className="text-xs text-muted-foreground">
                  Atual: {equipment.currentTemp}°C
                </div>
              </div>

              {/* Power Button */}
              <div className="flex justify-center">
              <Button
                  size="lg"
                  onClick={handlePowerToggle}
                  className={`rounded-full w-14 h-14 transition-all duration-300 ${
                    equipment.isOn 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg" 
                      : "bg-background text-muted-foreground border border-border hover:bg-muted"
                  }`}
                >
                  <Power className="h-5 w-5" />
                </Button>
              </div>

              {/* Temperature Controls */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handleTempChange(false)}
                  disabled={!equipment.isOn || localTemp <= -30}
                  className="rounded-full w-10 h-10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-center min-w-[60px]">
                  <div className="text-xl font-bold">{localTemp}°C</div>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handleTempChange(true)}
                  disabled={!equipment.isOn || localTemp >= 50}
                  className="rounded-full w-10 h-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Mode Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={localMode === "cool" ? "cooling" : "outline"}
                  onClick={() => handleModeChange("cool")}
                  disabled={!equipment.isOn}
                  className="flex flex-col gap-1 h-14"
                >
                  <Snowflake className="h-4 w-4" />
                  <span className="text-xs">FRIO</span>
                </Button>
                <Button
                  variant={localMode === "heat" ? "heating" : "outline"}
                  onClick={() => handleModeChange("heat")}
                  disabled={!equipment.isOn}
                  className="flex flex-col gap-1 h-14"
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-xs">QUENTE</span>
                </Button>
                <Button
                  variant={localMode === "fan" ? "energy" : "outline"}
                  onClick={() => handleModeChange("fan")}
                  disabled={!equipment.isOn}
                  className="flex flex-col gap-1 h-14"
                >
                  <Wind className="h-4 w-4" />
                  <span className="text-xs">VENTO</span>
                </Button>
              </div>

              {/* Fan Speed */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Velocidade do Ventilador
                </Label>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((speed) => (
                    <Button
                      key={speed}
                      variant={fanSpeed === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFanSpeed(speed)}
                      disabled={!equipment.isOn}
                      className="h-8"
                    >
                      {speed}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Timer Section */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Timer - Desligar em:
                </Label>
                {timerEnabled ? (
                  <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium">
                      {timerHours}h {timerMinutes}min restantes
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleTimerCancel}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        value={timerHours}
                        onChange={(e) => setTimerHours(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-14 h-8 text-center text-sm"
                        disabled={!equipment.isOn}
                      />
                      <span className="text-xs text-muted-foreground">h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-14 h-8 text-center text-sm"
                        disabled={!equipment.isOn}
                      />
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTimerSet}
                      disabled={!equipment.isOn || (timerHours === 0 && timerMinutes === 0)}
                      className="h-8"
                    >
                      <Timer className="h-3 w-3 mr-1" />
                      Definir
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Setpoints Interface - Opção C */
            <div className="space-y-4">
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
                  Entre <strong>{heatTargetTemp}°C</strong> e <strong>{coolTargetTemp}°C</strong>, o equipamento permanecerá desligado.
                </p>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  O sistema ativará automaticamente o modo apropriado com base na temperatura atual.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentControlDialog;