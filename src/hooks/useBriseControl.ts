import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { BriseAction } from "@/lib/brise";
import i18n from "@/lib/i18n";

export function useBriseControl() {
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspaceContext();

  const sendCommand = async (
    deviceId: string,
    action: BriseAction,
    value?: string | number,
    timerMinutes?: number
  ): Promise<boolean> => {
    if (!currentWorkspaceId) {
      toast({
        title: i18n.t("common.error"),
        description: i18n.t("brise.noWorkspace"),
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke("brise-control", {
        body: { deviceId, action, value, timerMinutes, workspaceId: currentWorkspaceId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      return true;
    } catch (error: any) {
      console.error("Error sending BRISE command:", error);
      toast({
        title: i18n.t("brise.sendError"),
        description: error.message || i18n.t("brise.tryAgain"),
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

  const setTimer = async (deviceId: string, minutes: number): Promise<boolean> => {
    return sendCommand(deviceId, "setTimer", undefined, minutes);
  };

  const cancelTimer = async (deviceId: string): Promise<boolean> => {
    return sendCommand(deviceId, "cancelTimer");
  };

  return {
    sendCommand,
    turnOn,
    turnOff,
    setTemperature,
    setMode,
    setTimer,
    cancelTimer,
  };
}
