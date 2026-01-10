import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { SmartThingsAction } from "@/lib/smartthings";
import i18n from "@/lib/i18n";

export function useSmartThingsControl() {
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspaceContext();

  const sendCommand = async (
    deviceId: string,
    action: SmartThingsAction,
    value?: string | number
  ): Promise<boolean> => {
    if (!currentWorkspaceId) {
      toast({
        title: i18n.t("common.error"),
        description: i18n.t("hooks.smartThingsControl.noWorkspace"),
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke("smartthings-control", {
        body: { deviceId, action, value, workspaceId: currentWorkspaceId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      return true;
    } catch (error: any) {
      console.error("Error sending command:", error);
      toast({
        title: i18n.t("hooks.smartThingsControl.sendError"),
        description: error.message || i18n.t("hooks.smartThingsControl.tryAgain"),
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
