import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { SmartThingsAction } from "@/lib/smartthings";

export function useSmartThingsControl() {
  const { toast } = useToast();

  const sendCommand = async (
    deviceId: string,
    action: SmartThingsAction,
    value?: string | number
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("smartthings-control", {
        body: { deviceId, action, value },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      return true;
    } catch (error: any) {
      console.error("Error sending command:", error);
      toast({
        title: "Erro ao enviar comando",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const turnOn = async (deviceId: string): Promise<boolean> => {
    return sendCommand(deviceId, "turnOn");
  };

  const turnOff = async (deviceId: string): Promise<boolean> => {
    return sendCommand(deviceId, "turnOff");
  };

  const setTemperature = async (deviceId: string, temp: number): Promise<boolean> => {
    return sendCommand(deviceId, "setTemperature", temp);
  };

  const setMode = async (deviceId: string, mode: string): Promise<boolean> => {
    return sendCommand(deviceId, "setMode", mode);
  };

  const setFanSpeed = async (deviceId: string, speed: string): Promise<boolean> => {
    return sendCommand(deviceId, "setFanSpeed", speed);
  };

  return {
    sendCommand,
    turnOn,
    turnOff,
    setTemperature,
    setMode,
    setFanSpeed,
  };
}
