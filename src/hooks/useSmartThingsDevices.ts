import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { SmartThingsDevice } from "@/lib/smartthings";
import i18n from "@/lib/i18n";

export function useSmartThingsDevices() {
  const [devices, setDevices] = useState<SmartThingsDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspaceContext();

  const discoverDevices = async (): Promise<SmartThingsDevice[]> => {
    if (!currentWorkspaceId) {
      toast({
        title: i18n.t("common.error"),
        description: i18n.t("hooks.smartThingsDevices.noWorkspace"),
        variant: "destructive",
      });
      return [];
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("smartthings-devices", {
        body: { workspaceId: currentWorkspaceId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const discoveredDevices = data.devices || [];
      setDevices(discoveredDevices);
      return discoveredDevices;
    } catch (error: any) {
      console.error("Error discovering devices:", error);
      toast({
        title: i18n.t("hooks.smartThingsDevices.discoverError"),
        description: error.message || i18n.t("hooks.smartThingsDevices.checkConfig"),
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const syncDevice = async (equipmentId: string): Promise<boolean> => {
    if (!currentWorkspaceId) {
      toast({
        title: i18n.t("common.error"),
        description: i18n.t("hooks.smartThingsDevices.noWorkspace"),
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke("smartthings-sync", {
        body: { equipmentId, workspaceId: currentWorkspaceId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: i18n.t("hooks.smartThingsDevices.synced"),
        description: i18n.t("hooks.smartThingsDevices.syncedDesc"),
      });

      return true;
    } catch (error: any) {
      console.error("Error syncing device:", error);
      toast({
        title: i18n.t("hooks.smartThingsDevices.syncError"),
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const syncAllDevices = async (): Promise<boolean> => {
    if (!currentWorkspaceId) {
      toast({
        title: i18n.t("common.error"),
        description: i18n.t("hooks.smartThingsDevices.noWorkspace"),
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke("smartthings-sync", {
        body: { workspaceId: currentWorkspaceId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      
      toast({
        title: i18n.t("hooks.smartThingsDevices.syncComplete"),
        description: i18n.t("hooks.smartThingsDevices.syncCompleteDesc", { count: successCount }),
      });

      return true;
    } catch (error: any) {
      console.error("Error syncing all devices:", error);
      toast({
        title: i18n.t("hooks.smartThingsDevices.syncAllError"),
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    devices,
    isLoading,
    discoverDevices,
    syncDevice,
    syncAllDevices,
  };
}
