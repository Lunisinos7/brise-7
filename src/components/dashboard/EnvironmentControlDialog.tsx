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
import { useTranslation } from "react-i18next";
import { Equipment } from "@/hooks/useEquipments";
import { Environment } from "@/contexts/EnvironmentContext";

interface EnvironmentControlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  environment: Environment | null;
  equipments: Equipment[];
  onUpdateEquipments: (updates: Partial<Equipment>) => Promise<void>;
  onUpdateEnvironment: (updates: Partial<Omit<Environment, "id">>) => Promise<void>;
}

const EnvironmentControlDialog = ({
  isOpen,
  onClose,
  environment,
  equipments,
  onUpdateEquipments,
  onUpdateEnvironment,
}: EnvironmentControlDialogProps) => {
  const { t } = useTranslation();
  const [isManualMode, setIsManualMode] = useState(true);
  
  // Setpoints mode state - Opção C: configurações separadas para aquecimento e refrigeração
  const [coolingEnabled, setCoolingEnabled] = useState(true);
  const [heatingEnabled, setHeatingEnabled] = useState(true);
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

  // Sync state with environment setpoints when dialog opens
  useEffect(() => {
    if (isOpen && environment) {
      setIsManualMode(!environment.isAutomatic);
      setCoolingEnabled(environment.coolingEnabled);
      setHeatingEnabled(environment.heatingEnabled);
      setCoolTriggerTemp(environment.coolTriggerTemp);
      setCoolTargetTemp(environment.coolTargetTemp);
      setHeatTriggerTemp(environment.heatTriggerTemp);
      setHeatTargetTemp(environment.heatTargetTemp);
    }
  }, [isOpen, environment]);

  // Sync manual mode state with equipments when dialog opens
  useEffect(() => {
    if (isOpen && equipments.length > 0) {
      setTargetTemp(avgTargetTemp);
      const firstEquipment = equipments[0];
      if (firstEquipment.mode === "cool" || firstEquipment.mode === "heat" || firstEquipment.mode === "fan") {
        setMode(firstEquipment.mode);
      }
    }
  }, [isOpen, equipments, avgTargetTemp]);

  // Save setpoints when they change (debounced via mode toggle)
  const handleModeToggle = async (manual: boolean) => {
    setIsManualMode(manual);
    await onUpdateEnvironment({
      isAutomatic: !manual,
      coolingEnabled,
      heatingEnabled,
      coolTriggerTemp,
      coolTargetTemp,
      heatTriggerTemp,
      heatTargetTemp,
    });
  };

  // Save setpoints when closing the dialog
  const handleClose = async () => {
    if (environment) {
      await onUpdateEnvironment({
        isAutomatic: !isManualMode,
        coolingEnabled,
        heatingEnabled,
        coolTriggerTemp,
        coolTargetTemp,
        heatTriggerTemp,
        heatTargetTemp,
      });
    }
    onClose();
  };

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
      case "cool": return t("equipmentControlDialog.cool");
      case "heat": return t("equipmentControlDialog.heat");
      case "fan": return t("equipmentControlDialog.fan");
      default: return t("equipmentControlDialog.cool");
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
    // Se ambos os modos estão ativos, validar não-sobreposição
    if (heatingEnabled) {
      if (newValue > heatTargetTemp) {
        setCoolTriggerTemp(newValue);
        if (coolTargetTemp >= newValue) {
          setCoolTargetTemp(newValue - 1);
        }
      }
    } else {
      // Sem validação cruzada
      setCoolTriggerTemp(newValue);
      if (coolTargetTemp >= newValue) {
        setCoolTargetTemp(newValue - 1);
      }
    }
  };

  const handleCoolTargetChange = (value: number[]) => {
    const newValue = value[0];
    if (heatingEnabled) {
      if (newValue < coolTriggerTemp && newValue >= heatTargetTemp) {
        setCoolTargetTemp(newValue);
      }
    } else {
      if (newValue < coolTriggerTemp) {
        setCoolTargetTemp(newValue);
      }
    }
  };

  const handleHeatTriggerChange = (value: number[]) => {
    const newValue = value[0];
    if (coolingEnabled) {
      if (newValue < coolTargetTemp) {
        setHeatTriggerTemp(newValue);
        if (heatTargetTemp <= newValue) {
          setHeatTargetTemp(newValue + 1);
        }
      }
    } else {
      // Sem validação cruzada
      setHeatTriggerTemp(newValue);
      if (heatTargetTemp <= newValue) {
        setHeatTargetTemp(newValue + 1);
      }
    }
  };

  const handleHeatTargetChange = (value: number[]) => {
    const newValue = value[0];
    if (coolingEnabled) {
      if (newValue > heatTriggerTemp && newValue <= coolTargetTemp) {
        setHeatTargetTemp(newValue);
      }
    } else {
      if (newValue > heatTriggerTemp) {
        setHeatTargetTemp(newValue);
      }
    }
  };

  // Toggle de refrigeração com auto-correção
  const handleCoolingToggle = (enabled: boolean) => {
    if (enabled && heatingEnabled) {
      // Verificar sobreposição e corrigir se necessário
      if (coolTargetTemp <= heatTargetTemp) {
        setCoolTargetTemp(heatTargetTemp + 1);
      }
      if (coolTriggerTemp <= heatTargetTemp) {
        setCoolTriggerTemp(heatTargetTemp + 2);
      }
    }
    setCoolingEnabled(enabled);
  };

  // Toggle de aquecimento com auto-correção
  const handleHeatingToggle = (enabled: boolean) => {
    if (enabled && coolingEnabled) {
      // Verificar sobreposição e corrigir se necessário
      if (heatTargetTemp >= coolTargetTemp) {
        setHeatTargetTemp(coolTargetTemp - 1);
      }
      if (heatTriggerTemp >= coolTargetTemp) {
        setHeatTriggerTemp(coolTargetTemp - 2);
      }
    }
    setHeatingEnabled(enabled);
  };

  // Gerar texto da zona de conforto
  const getComfortZoneText = () => {
    if (coolingEnabled && heatingEnabled) {
      return t("environmentControlDialog.comfortZoneText", { min: heatTargetTemp, max: coolTargetTemp });
    } else if (coolingEnabled) {
      return t("environmentControlDialog.coolShutdownText", { temp: coolTargetTemp });
    } else if (heatingEnabled) {
      return t("environmentControlDialog.heatShutdownText", { temp: heatTargetTemp });
    }
    return t("environmentControlDialog.noAutoMode");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("environmentControlDialog.control")} - {environment?.name || ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-3 p-3 bg-muted/80 dark:bg-white/5 rounded-lg">
            <span className={cn(
              "text-sm font-medium transition-colors",
              !isManualMode ? "text-foreground" : "text-muted-foreground"
            )}>
              {t("environmentControlDialog.automaticMode")}
            </span>
            <Switch
              checked={isManualMode}
              onCheckedChange={setIsManualMode}
              className="data-[state=checked]:bg-muted-foreground data-[state=unchecked]:bg-muted-foreground"
            />
            <span className={cn(
              "text-sm font-medium transition-colors",
              isManualMode ? "text-foreground" : "text-muted-foreground"
            )}>
              {t("environmentControlDialog.manualMode")}
            </span>
          </div>

          {!isManualMode ? (
            /* Setpoints Mode - Opção C */
            <div className="space-y-5">
              {/* Refrigeração */}
              <div className={cn(
                "p-4 rounded-lg border space-y-4 transition-opacity",
                coolingEnabled 
                  ? "border-blue-500/30 dark:border-blue-500/20 bg-muted/80 dark:bg-white/5" 
                  : "border-muted bg-muted/30 opacity-60"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Snowflake className={cn("h-5 w-5", coolingEnabled ? "text-blue-500" : "text-muted-foreground")} />
                    <h3 className={cn("font-semibold", coolingEnabled ? "text-blue-500" : "text-muted-foreground")}>{t("environmentControlDialog.cooling")}</h3>
                  </div>
                  <Switch
                    checked={coolingEnabled}
                    onCheckedChange={handleCoolingToggle}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
                
                {/* Cool Trigger */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn("text-sm", !coolingEnabled && "text-muted-foreground")}>{t("environmentControlDialog.turnOnAbove")}</Label>
                    <span className={cn("text-lg font-bold", coolingEnabled ? "text-blue-500" : "text-muted-foreground")}>{coolTriggerTemp}°C</span>
                  </div>
                  <Slider
                    value={[coolTriggerTemp]}
                    onValueChange={handleCoolTriggerChange}
                    min={-30}
                    max={50}
                    step={1}
                    className="w-full [&_[role=slider]]:border-blue-500 [&_.bg-primary]:bg-blue-500"
                    disabled={!coolingEnabled}
                  />
                </div>

                {/* Cool Target */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn("text-sm", !coolingEnabled && "text-muted-foreground")}>{t("environmentControlDialog.coolTo")}</Label>
                    <span className={cn("text-lg font-bold", coolingEnabled ? "text-blue-500" : "text-muted-foreground")}>{coolTargetTemp}°C</span>
                  </div>
                  <Slider
                    value={[coolTargetTemp]}
                    onValueChange={handleCoolTargetChange}
                    min={-30}
                    max={coolTriggerTemp - 1}
                    step={1}
                    className="w-full [&_[role=slider]]:border-blue-500 [&_.bg-primary]:bg-blue-500"
                    disabled={!coolingEnabled}
                  />
                </div>
              </div>

              {/* Aquecimento */}
              <div className={cn(
                "p-4 rounded-lg border space-y-4 transition-opacity",
                heatingEnabled 
                  ? "border-red-500/30 dark:border-red-500/20 bg-muted/80 dark:bg-white/5" 
                  : "border-muted bg-muted/30 opacity-60"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className={cn("h-5 w-5", heatingEnabled ? "text-red-500" : "text-muted-foreground")} />
                    <h3 className={cn("font-semibold", heatingEnabled ? "text-red-500" : "text-muted-foreground")}>{t("environmentControlDialog.heating")}</h3>
                  </div>
                  <Switch
                    checked={heatingEnabled}
                    onCheckedChange={handleHeatingToggle}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>
                
                {/* Heat Trigger */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn("text-sm", !heatingEnabled && "text-muted-foreground")}>{t("environmentControlDialog.turnOnBelow")}</Label>
                    <span className={cn("text-lg font-bold", heatingEnabled ? "text-red-500" : "text-muted-foreground")}>{heatTriggerTemp}°C</span>
                  </div>
                  <Slider
                    value={[heatTriggerTemp]}
                    onValueChange={handleHeatTriggerChange}
                    min={-30}
                    max={50}
                    step={1}
                    className="w-full [&_[role=slider]]:border-red-500 [&_.bg-primary]:bg-red-500"
                    disabled={!heatingEnabled}
                  />
                </div>

                {/* Heat Target */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn("text-sm", !heatingEnabled && "text-muted-foreground")}>{t("environmentControlDialog.heatTo")}</Label>
                    <span className={cn("text-lg font-bold", heatingEnabled ? "text-red-500" : "text-muted-foreground")}>{heatTargetTemp}°C</span>
                  </div>
                  <Slider
                    value={[heatTargetTemp]}
                    onValueChange={handleHeatTargetChange}
                    min={heatTriggerTemp + 1}
                    max={50}
                    step={1}
                    className="w-full [&_[role=slider]]:border-red-500 [&_.bg-primary]:bg-red-500"
                    disabled={!heatingEnabled}
                  />
                </div>
              </div>

              {/* Zona de Conforto */}
              {(coolingEnabled || heatingEnabled) && (
                <div className="p-4 bg-green-50/90 dark:bg-green-900/40 rounded-lg border border-green-300 dark:border-green-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {coolingEnabled && heatingEnabled ? t("environmentControlDialog.comfortZone") : t("environmentControlDialog.shutdownCondition")}
                    </span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {getComfortZoneText()}
                  </p>
                </div>
              )}
              
              {!coolingEnabled && !heatingEnabled && (
                <div className="p-4 bg-yellow-50/90 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700/50">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ {t("environmentControlDialog.noAutoModeWarning")}
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-muted/80 dark:bg-white/5 rounded-lg">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {t("environmentControlDialog.autoModeInfo")}
                </p>
              </div>
            </div>
          ) : (
            /* Manual Mode */
            <div className="space-y-6">
              {/* Status Badges */}
              <div className="flex items-center justify-center gap-2">
                <Badge variant={isAnyOn ? "default" : "secondary"}>
                  {isAnyOn ? t("environmentControlDialog.on") : t("environmentControlDialog.off")}
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
                  {t("environmentControlDialog.current")}: {avgCurrentTemp}°C
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
                  {t("equipmentControlDialog.cool")}
                </Button>
                <Button
                  variant={mode === "heat" ? "default" : "outline"}
                  className={cn(mode === "heat" && "bg-heating hover:bg-heating/90")}
                  onClick={() => handleModeChange("heat")}
                  disabled={!isAnyOn}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  {t("equipmentControlDialog.heat")}
                </Button>
                <Button
                  variant={mode === "fan" ? "default" : "outline"}
                  onClick={() => handleModeChange("fan")}
                  disabled={!isAnyOn}
                >
                  <Wind className="h-4 w-4 mr-2" />
                  {t("equipmentControlDialog.fan")}
                </Button>
              </div>

              {/* Fan Speed */}
              <div className="space-y-2">
                <Label className="text-sm">{t("environmentControlDialog.fanSpeed")}</Label>
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
                  <Label className="text-sm">{t("environmentControlDialog.timer")}</Label>
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
                    {t("environmentControlDialog.setTimer")}
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
