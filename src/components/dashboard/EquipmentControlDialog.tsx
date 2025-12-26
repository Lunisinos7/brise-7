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
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useBriseControl } from "@/hooks/useBriseControl";
import { useSmartThingsControl } from "@/hooks/useSmartThingsControl";

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
  brise_device_id?: string | null;
  smartthings_device_id?: string | null;
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const briseControl = useBriseControl();
  const smartThingsControl = useSmartThingsControl();
  
  const [localTemp, setLocalTemp] = useState(equipment?.targetTemp || 22);
  const [localMode, setLocalMode] = useState(equipment?.mode || "cool");
  const [fanSpeed, setFanSpeed] = useState(2);
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [isManualMode, setIsManualMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Setpoints - Opção C: configurações separadas
  const [coolingEnabled, setCoolingEnabled] = useState(true);
  const [heatingEnabled, setHeatingEnabled] = useState(true);
  const [coolTriggerTemp, setCoolTriggerTemp] = useState(28);
  const [coolTargetTemp, setCoolTargetTemp] = useState(24);
  const [heatTriggerTemp, setHeatTriggerTemp] = useState(18);
  const [heatTargetTemp, setHeatTargetTemp] = useState(22);

  useEffect(() => {
    setLocalTemp(equipment?.targetTemp || 22);
    setLocalMode(equipment?.mode || "cool");
  }, [equipment?.id]);

  if (!equipment) return null;

  const handlePowerToggle = async () => {
    const newState = !equipment.isOn;
    setIsLoading(true);
    
    try {
      let apiSuccess = true;
      
      // Call real API based on integration type
      if (equipment.brise_device_id) {
        apiSuccess = newState 
          ? await briseControl.turnOn(equipment.brise_device_id)
          : await briseControl.turnOff(equipment.brise_device_id);
      } else if (equipment.smartthings_device_id) {
        apiSuccess = newState
          ? await smartThingsControl.turnOn(equipment.smartthings_device_id)
          : await smartThingsControl.turnOff(equipment.smartthings_device_id);
      }
      
      if (!apiSuccess) {
        setIsLoading(false);
        return;
      }
      
      onUpdate(equipment.id, { isOn: newState });
      toast({
        title: newState ? t("equipmentControlDialog.equipmentOn") : t("equipmentControlDialog.equipmentOff"),
        description: t("equipmentControlDialog.equipmentToggled", { 
          name: equipment.name, 
          state: newState ? t("dashboard.turnedOn") : t("dashboard.turnedOff") 
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTempChange = async (increment: boolean) => {
    const newTemp = increment ? localTemp + 1 : localTemp - 1;
    if (newTemp >= -30 && newTemp <= 50) {
      setLocalTemp(newTemp);
      
      // Call real API based on integration type
      if (equipment.brise_device_id) {
        await briseControl.setTemperature(equipment.brise_device_id, newTemp);
      } else if (equipment.smartthings_device_id) {
        await smartThingsControl.setTemperature(equipment.smartthings_device_id, newTemp);
      }
      
      onUpdate(equipment.id, { targetTemp: newTemp });
    }
  };

  const handleModeChange = async (mode: string) => {
    setLocalMode(mode);
    
    // Call real API based on integration type
    if (equipment.brise_device_id) {
      await briseControl.setMode(equipment.brise_device_id, mode);
    } else if (equipment.smartthings_device_id) {
      await smartThingsControl.setMode(equipment.smartthings_device_id, mode);
    }
    
    onUpdate(equipment.id, { mode });
    const modeTranslation = mode === "cool" 
      ? t("equipmentControlDialog.modeCool") 
      : mode === "heat" 
        ? t("equipmentControlDialog.modeHeat") 
        : t("equipmentControlDialog.modeFan");
    toast({
      title: t("equipmentControlDialog.modeChanged"),
      description: t("equipmentControlDialog.modeChangedDesc", { mode: modeTranslation }),
    });
  };

  const handleTimerSet = () => {
    if (timerHours > 0 || timerMinutes > 0) {
      setTimerEnabled(true);
      toast({
        title: t("equipmentControlDialog.timerSet"),
        description: t("equipmentControlDialog.timerSetDesc", { hours: timerHours, minutes: timerMinutes }),
      });
    }
  };

  const handleTimerCancel = () => {
    setTimerEnabled(false);
    setTimerHours(0);
    setTimerMinutes(0);
    toast({
      title: t("equipmentControlDialog.timerCancelled"),
      description: t("equipmentControlDialog.timerCancelledDesc"),
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
    if (heatingEnabled) {
      if (newValue > heatTargetTemp) {
        setCoolTriggerTemp(newValue);
        if (coolTargetTemp >= newValue) {
          setCoolTargetTemp(newValue - 1);
        }
      }
    } else {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            {t("equipmentControlDialog.control")} - {equipment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-3 p-3 bg-muted/30 rounded-lg">
            <Label className={`text-sm ${!isManualMode ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              {t("equipmentControlDialog.automatic")}
            </Label>
            <Switch
              checked={isManualMode}
              onCheckedChange={setIsManualMode}
            />
            <Label className={`text-sm ${isManualMode ? "font-semibold text-primary" : "text-muted-foreground"}`}>
              {t("equipmentControlDialog.manual")}
            </Label>
          </div>

          {isManualMode ? (
            /* Remote Control Interface */
            <div className="bg-gradient-to-b from-muted/50 to-muted rounded-2xl p-4 space-y-4">
              {/* Status Display */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={equipment.isOn ? "default" : "secondary"}>
                    {equipment.isOn ? t("equipmentControlDialog.on") : t("equipmentControlDialog.off")}
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
                  {t("equipmentControlDialog.current")} {equipment.currentTemp}°C
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
                  <span className="text-xs">{t("equipmentControlDialog.cool")}</span>
                </Button>
                <Button
                  variant={localMode === "heat" ? "heating" : "outline"}
                  onClick={() => handleModeChange("heat")}
                  disabled={!equipment.isOn}
                  className="flex flex-col gap-1 h-14"
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-xs">{t("equipmentControlDialog.heat")}</span>
                </Button>
                <Button
                  variant={localMode === "fan" ? "energy" : "outline"}
                  onClick={() => handleModeChange("fan")}
                  disabled={!equipment.isOn}
                  className="flex flex-col gap-1 h-14"
                >
                  <Wind className="h-4 w-4" />
                  <span className="text-xs">{t("equipmentControlDialog.fan")}</span>
                </Button>
              </div>

              {/* Fan Speed */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  {t("equipmentControlDialog.fanSpeed")}
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
                  {t("equipmentControlDialog.timer")}
                </Label>
                {timerEnabled ? (
                  <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium">
                      {timerHours}h {timerMinutes}min {t("equipmentControlDialog.remaining")}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleTimerCancel}
                    >
                      {t("equipmentControlDialog.cancelTimer")}
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
                      {t("equipmentControlDialog.setTimer")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Setpoints Interface - Opção C */
            <div className="space-y-4">
              {/* Refrigeração */}
              <div className={cn(
                "p-4 rounded-lg border space-y-4 transition-opacity",
                coolingEnabled 
                  ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" 
                  : "border-muted bg-muted/30 opacity-60"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Snowflake className={cn("h-5 w-5", coolingEnabled ? "text-blue-500" : "text-muted-foreground")} />
                    <h3 className={cn("font-semibold", coolingEnabled ? "text-blue-700 dark:text-blue-300" : "text-muted-foreground")}>{t("environmentControlDialog.cooling")}</h3>
                  </div>
                  <Switch
                    checked={coolingEnabled}
                    onCheckedChange={handleCoolingToggle}
                  />
                </div>
                
                {/* Cool Trigger */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn("text-sm", !coolingEnabled && "text-muted-foreground")}>{t("environmentControlDialog.turnOnAbove")}</Label>
                    <span className={cn("text-lg font-bold", coolingEnabled ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{coolTriggerTemp}°C</span>
                  </div>
                  <Slider
                    value={[coolTriggerTemp]}
                    onValueChange={handleCoolTriggerChange}
                    min={-30}
                    max={50}
                    step={1}
                    className="w-full"
                    disabled={!coolingEnabled}
                  />
                </div>

                {/* Cool Target */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn("text-sm", !coolingEnabled && "text-muted-foreground")}>{t("environmentControlDialog.coolTo")}</Label>
                    <span className={cn("text-lg font-bold", coolingEnabled ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>{coolTargetTemp}°C</span>
                  </div>
                  <Slider
                    value={[coolTargetTemp]}
                    onValueChange={handleCoolTargetChange}
                    min={-30}
                    max={coolTriggerTemp - 1}
                    step={1}
                    className="w-full"
                    disabled={!coolingEnabled}
                  />
                </div>
              </div>

              {/* Aquecimento */}
              <div className={cn(
                "p-4 rounded-lg border space-y-4 transition-opacity",
                heatingEnabled 
                  ? "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20" 
                  : "border-muted bg-muted/30 opacity-60"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className={cn("h-5 w-5", heatingEnabled ? "text-orange-500" : "text-muted-foreground")} />
                    <h3 className={cn("font-semibold", heatingEnabled ? "text-orange-700 dark:text-orange-300" : "text-muted-foreground")}>{t("environmentControlDialog.heating")}</h3>
                  </div>
                  <Switch
                    checked={heatingEnabled}
                    onCheckedChange={handleHeatingToggle}
                  />
                </div>
                
                {/* Heat Trigger */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn("text-sm", !heatingEnabled && "text-muted-foreground")}>{t("environmentControlDialog.turnOnBelow")}</Label>
                    <span className={cn("text-lg font-bold", heatingEnabled ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground")}>{heatTriggerTemp}°C</span>
                  </div>
                  <Slider
                    value={[heatTriggerTemp]}
                    onValueChange={handleHeatTriggerChange}
                    min={-30}
                    max={50}
                    step={1}
                    className="w-full"
                    disabled={!heatingEnabled}
                  />
                </div>

                {/* Heat Target */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={cn("text-sm", !heatingEnabled && "text-muted-foreground")}>{t("environmentControlDialog.heatTo")}</Label>
                    <span className={cn("text-lg font-bold", heatingEnabled ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground")}>{heatTargetTemp}°C</span>
                  </div>
                  <Slider
                    value={[heatTargetTemp]}
                    onValueChange={handleHeatTargetChange}
                    min={heatTriggerTemp + 1}
                    max={50}
                    step={1}
                    className="w-full"
                    disabled={!heatingEnabled}
                  />
                </div>
              </div>

              {/* Zona de Conforto */}
              {(coolingEnabled || heatingEnabled) && (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
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
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ {t("environmentControlDialog.noAutoModeWarning")}
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {t("environmentControlDialog.autoModeInfo")}
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