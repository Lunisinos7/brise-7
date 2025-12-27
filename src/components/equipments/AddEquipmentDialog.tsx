import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Equipment } from "@/hooks/useEquipments";
import { useSmartThingsConfig } from "@/hooks/useSmartThingsConfig";
import { useSmartThingsDevices } from "@/hooks/useSmartThingsDevices";
import { useBriseConfig } from "@/hooks/useBriseConfig";
import { useBriseDevices } from "@/hooks/useBriseDevices";
import { SmartThingsDevice } from "@/lib/smartthings";
import { BriseDevice } from "@/lib/brise";
import { Loader2, Wifi, AlertCircle, RefreshCw, Settings, Snowflake } from "lucide-react";
import { Link } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEquipment: (equipment: Omit<Equipment, "id"> & { 
    smartthings_device_id?: string;
    smartthings_capabilities?: any;
    brise_device_id?: string;
  }) => Promise<void>;
}

export function AddEquipmentDialog({ open, onOpenChange, onAddEquipment }: AddEquipmentDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { isConfigured: isSmartThingsConfigured, isLoading: isConfigLoading } = useSmartThingsConfig();
  const { devices: smartThingsDevices, isLoading: isDevicesLoading, discoverDevices: discoverSmartThingsDevices } = useSmartThingsDevices();
  const { isConfigured: isBriseConfigured, isLoading: isBriseConfigLoading } = useBriseConfig();
  const { devices: briseDevices, isLoading: isBriseDevicesLoading, discoverDevices: discoverBriseDevices } = useBriseDevices();
  const [selectedDevice, setSelectedDevice] = useState<SmartThingsDevice | null>(null);
  const [selectedBriseDevice, setSelectedBriseDevice] = useState<BriseDevice | null>(null);

  const equipmentSchema = z.object({
    name: z.string().min(1, t("equipments.validation.nameRequired")),
    location: z.string().min(1, t("equipments.validation.locationRequired")),
    model: z.string().min(1, t("equipments.validation.modelRequired")),
    capacity: z.string()
      .min(1, t("equipments.validation.capacityRequired"))
      .refine((val) => {
        const num = parseInt(val);
        return num >= 1000 && num <= 100000;
      }, t("equipments.validation.capacityRange")),
    nominalPower: z.string().optional().refine((val) => {
      if (!val || val === "") return true;
      const num = parseInt(val);
      return num >= 100 && num <= 50000;
    }, t("equipments.validation.nominalPowerRange")),
    integration: z.enum(["BRISE", "SMART", "SMARTTHINGS"], {
      required_error: t("equipments.validation.integrationRequired"),
    }),
    smartthingsDeviceId: z.string().optional(),
  });

  type EquipmentFormData = z.infer<typeof equipmentSchema>;

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      location: "",
      model: "",
      capacity: "",
      nominalPower: "",
      integration: undefined,
      smartthingsDeviceId: undefined,
    },
  });

  const watchIntegration = form.watch("integration");

  // Fetch devices when integration is selected
  useEffect(() => {
    if (watchIntegration === "SMARTTHINGS" && isSmartThingsConfigured && smartThingsDevices.length === 0) {
      discoverSmartThingsDevices();
    }
    if (watchIntegration === "BRISE" && isBriseConfigured && briseDevices.length === 0) {
      discoverBriseDevices();
    }
  }, [watchIntegration, isSmartThingsConfigured, isBriseConfigured]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedDevice(null);
      setSelectedBriseDevice(null);
    }
  }, [open]);

  const handleDeviceSelect = (device: SmartThingsDevice) => {
    setSelectedDevice(device);
    form.setValue("smartthingsDeviceId", device.deviceId);
    form.setValue("name", device.name);
    form.setValue("model", device.model);
    // Try to extract capacity from model name or default
    const capacityMatch = device.model.match(/\d+/);
    if (capacityMatch) {
      form.setValue("capacity", capacityMatch[0] + "000");
    }
  };

  const handleBriseDeviceSelect = (device: BriseDevice) => {
    setSelectedBriseDevice(device);
    form.setValue("name", device.name);
    form.setValue("model", device.model);
  };

  const onSubmit = async (data: EquipmentFormData) => {
    setIsLoading(true);
    
    try {
      const capacity = parseInt(data.capacity);
      const nominalPower = data.nominalPower ? parseInt(data.nominalPower) : null;
      
      const newEquipment: Omit<Equipment, "id"> & { 
        smartthings_device_id?: string;
        smartthings_capabilities?: any;
        brise_device_id?: string;
      } = {
        name: data.name,
        location: data.location,
        model: data.model,
        capacity: capacity,
        integration: data.integration === "SMARTTHINGS" ? "SMART" : data.integration,
        isOn: false,
        currentTemp: 25,
        targetTemp: 22,
        mode: "cool",
        energyConsumption: 0,
        nominalPower: nominalPower,
      };

      // Add SmartThings specific fields
      if (data.integration === "SMARTTHINGS" && selectedDevice) {
        newEquipment.smartthings_device_id = selectedDevice.deviceId;
        newEquipment.smartthings_capabilities = selectedDevice.capabilities;
      }

      // Add BRISE specific fields
      if (data.integration === "BRISE" && selectedBriseDevice) {
        newEquipment.brise_device_id = selectedBriseDevice.deviceId;
      }
      
      await onAddEquipment(newEquipment);

      toast({
        title: t("equipments.addDialog.successTitle"),
        description: t("equipments.addDialog.successDesc", { name: data.name }),
      });

      form.reset();
      setSelectedDevice(null);
      setSelectedBriseDevice(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t("equipments.addDialog.errorTitle"),
        description: t("equipments.addDialog.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableSmartThingsDevices = smartThingsDevices.filter(d => !d.isImported);
  const availableBriseDevices = briseDevices.filter(d => !d.isImported);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("equipments.addDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("equipments.addDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="integration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("equipments.integrationType")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("equipments.selectType")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SMART">SMART</SelectItem>
                      <SelectItem value="BRISE">BRISE</SelectItem>
                      <SelectItem value="SMARTTHINGS">SmartThings</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SmartThings Device Selection */}
            {watchIntegration === "SMARTTHINGS" && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                {isConfigLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !isSmartThingsConfigured ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="font-medium">{t("equipments.addDialog.notConfigured")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("equipments.addDialog.notConfiguredDesc")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        {t("equipments.addDialog.goToSettings")}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t("equipments.addDialog.selectDevice")}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => discoverSmartThingsDevices()}
                        disabled={isDevicesLoading}
                      >
                        {isDevicesLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {isDevicesLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          {t("equipments.addDialog.searchingDevices")}
                        </span>
                      </div>
                    ) : availableSmartThingsDevices.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        {smartThingsDevices.length > 0 
                          ? t("equipments.addDialog.allImported")
                          : t("equipments.addDialog.noDevicesFound")
                        }
                      </div>
                    ) : (
                      <RadioGroup
                        value={selectedDevice?.deviceId || ""}
                        onValueChange={(value) => {
                          const device = availableSmartThingsDevices.find(d => d.deviceId === value);
                          if (device) handleDeviceSelect(device);
                        }}
                        className="space-y-2"
                      >
                        {availableSmartThingsDevices.map((device) => (
                          <div
                            key={device.deviceId}
                            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedDevice?.deviceId === device.deviceId
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <RadioGroupItem value={device.deviceId} id={device.deviceId} />
                            <Label htmlFor={device.deviceId} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{device.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {device.manufacturerName} • {device.model}
                                  </p>
                                </div>
                                <Wifi className="h-4 w-4 text-blue-500" />
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </>
                )}
              </div>
            )}

            {/* BRISE Device Selection */}
            {watchIntegration === "BRISE" && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                {isBriseConfigLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !isBriseConfigured ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="font-medium">{t("equipments.addDialog.briseNotConfigured")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("equipments.addDialog.briseNotConfiguredDesc")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        {t("equipments.addDialog.goToSettings")}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t("equipments.addDialog.selectBriseDevice")}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => discoverBriseDevices()}
                        disabled={isBriseDevicesLoading}
                      >
                        {isBriseDevicesLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {isBriseDevicesLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          {t("equipments.addDialog.searchingDevices")}
                        </span>
                      </div>
                    ) : availableBriseDevices.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        {briseDevices.length > 0 
                          ? t("equipments.addDialog.allImported")
                          : t("equipments.addDialog.noDevicesFound")
                        }
                      </div>
                    ) : (
                      <RadioGroup
                        value={selectedBriseDevice?.deviceId || ""}
                        onValueChange={(value) => {
                          const device = availableBriseDevices.find(d => d.deviceId === value);
                          if (device) handleBriseDeviceSelect(device);
                        }}
                        className="space-y-2"
                      >
                        {availableBriseDevices.map((device) => (
                          <div
                            key={device.deviceId}
                            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedBriseDevice?.deviceId === device.deviceId
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <RadioGroupItem value={device.deviceId} id={device.deviceId} />
                            <Label htmlFor={device.deviceId} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{device.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {device.model}{device.location ? ` • ${device.location}` : ""}
                                  </p>
                                </div>
                                <Snowflake className="h-4 w-4 text-blue-500" />
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Manual form fields - show for non-SmartThings/BRISE or after device selection */}
            {((watchIntegration !== "SMARTTHINGS" && watchIntegration !== "BRISE") || selectedDevice || selectedBriseDevice) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("equipments.equipmentName")}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t("equipments.placeholders.name")} 
                            {...field} 
                            disabled={watchIntegration === "SMARTTHINGS" && !!selectedDevice}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("equipments.location")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("equipments.placeholders.location")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("equipments.model")}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t("equipments.placeholders.model")} 
                            {...field}
                            disabled={watchIntegration === "SMARTTHINGS" && !!selectedDevice}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("equipments.capacity")} (BTU/h)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={t("equipments.placeholders.capacity")} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nominalPower"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("equipments.nominalPower")} (W)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t("equipments.placeholders.nominalPower")} 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {t("equipments.nominalPowerHint")}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                variant="cooling" 
                disabled={isLoading || (watchIntegration === "SMARTTHINGS" && !selectedDevice)}
              >
                {isLoading ? t("common.adding") : t("equipments.addEquipment")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
