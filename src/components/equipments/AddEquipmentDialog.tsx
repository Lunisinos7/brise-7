import { useState, useEffect } from "react";
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
import { SmartThingsDevice } from "@/lib/smartthings";
import { Loader2, Wifi, AlertCircle, RefreshCw, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const equipmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  location: z.string().min(1, "Localização é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  capacity: z.string().min(1, "Capacidade é obrigatória"),
  integration: z.enum(["BRISE", "SMART", "SMARTTHINGS"], {
    required_error: "Selecione o tipo de integração",
  }),
  smartthingsDeviceId: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEquipment: (equipment: Omit<Equipment, "id"> & { 
    smartthings_device_id?: string;
    smartthings_capabilities?: any;
  }) => Promise<void>;
}

export function AddEquipmentDialog({ open, onOpenChange, onAddEquipment }: AddEquipmentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { isConfigured, isLoading: isConfigLoading } = useSmartThingsConfig();
  const { devices, isLoading: isDevicesLoading, discoverDevices } = useSmartThingsDevices();
  const [selectedDevice, setSelectedDevice] = useState<SmartThingsDevice | null>(null);

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      location: "",
      model: "",
      capacity: "",
      integration: undefined,
      smartthingsDeviceId: undefined,
    },
  });

  const watchIntegration = form.watch("integration");

  // Fetch SmartThings devices when integration is selected
  useEffect(() => {
    if (watchIntegration === "SMARTTHINGS" && isConfigured && devices.length === 0) {
      discoverDevices();
    }
  }, [watchIntegration, isConfigured]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedDevice(null);
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

  const onSubmit = async (data: EquipmentFormData) => {
    setIsLoading(true);
    
    try {
      const newEquipment: Omit<Equipment, "id"> & { 
        smartthings_device_id?: string;
        smartthings_capabilities?: any;
      } = {
        name: data.name,
        location: data.location,
        model: data.model,
        capacity: parseInt(data.capacity),
        integration: data.integration === "SMARTTHINGS" ? "SMART" : data.integration,
        isOn: false,
        currentTemp: 25,
        targetTemp: 22,
        mode: "cool",
        energyConsumption: 0,
        efficiency: 85,
      };

      // Add SmartThings specific fields
      if (data.integration === "SMARTTHINGS" && selectedDevice) {
        newEquipment.smartthings_device_id = selectedDevice.deviceId;
        newEquipment.smartthings_capabilities = selectedDevice.capabilities;
      }
      
      await onAddEquipment(newEquipment);

      toast({
        title: "Equipamento adicionado com sucesso!",
        description: `${data.name} foi adicionado à sua lista de equipamentos.`,
      });

      form.reset();
      setSelectedDevice(null);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao adicionar equipamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableDevices = devices.filter(d => !d.isImported);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Equipamento</DialogTitle>
          <DialogDescription>
            Preencha as informações do equipamento de climatização que deseja adicionar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="integration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Integração</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SMART">SMART</SelectItem>
                      <SelectItem value="BRISE">BRISE</SelectItem>
                      <SelectItem value="SMARTTHINGS">
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4" />
                          SmartThings
                        </div>
                      </SelectItem>
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
                ) : !isConfigured ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="font-medium">SmartThings não configurado</p>
                      <p className="text-sm text-muted-foreground">
                        Configure sua conta SmartThings nas configurações primeiro.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Ir para Configurações
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Selecione um dispositivo</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => discoverDevices()}
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
                          Buscando dispositivos...
                        </span>
                      </div>
                    ) : availableDevices.length === 0 ? (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        {devices.length > 0 
                          ? "Todos os dispositivos já foram importados."
                          : "Nenhum ar-condicionado encontrado na sua conta SmartThings."
                        }
                      </div>
                    ) : (
                      <RadioGroup
                        value={selectedDevice?.deviceId || ""}
                        onValueChange={(value) => {
                          const device = availableDevices.find(d => d.deviceId === value);
                          if (device) handleDeviceSelect(device);
                        }}
                        className="space-y-2"
                      >
                        {availableDevices.map((device) => (
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

            {/* Manual form fields - show for non-SmartThings or after device selection */}
            {(watchIntegration !== "SMARTTHINGS" || selectedDevice) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Equipamento</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Sala de Reuniões A" 
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
                        <FormLabel>Localização</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Térreo - Ala Norte" {...field} />
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
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Samsung AR12345" 
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
                        <FormLabel>Capacidade (BTU/h)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ex: 12000" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="cooling" 
                disabled={isLoading || (watchIntegration === "SMARTTHINGS" && !selectedDevice)}
              >
                {isLoading ? "Adicionando..." : "Adicionar Equipamento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
