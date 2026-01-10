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
      console.error("Error discovering SmartThings devices:", error);
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

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("smartthings-sync", {
        body: { equipmentId, workspaceId: currentWorkspaceId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      return true;
    } catch (error: any) {
      console.error("Error syncing SmartThings device:", error);
      toast({
        title: i18n.t("hooks.smartThingsDevices.syncError"),
        description: error.message || i18n.t("hooks.smartThingsControl.tryAgain"),
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("smartthings-sync", {
        body: { syncAll: true, workspaceId: currentWorkspaceId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: i18n.t("hooks.smartThingsDevices.syncSuccess"),
        description: i18n.t("hooks.smartThingsDevices.syncSuccessDesc", { count: data.synced || 0 }),
      });

      return true;
    } catch (error: any) {
      console.error("Error syncing all SmartThings devices:", error);
      toast({
        title: i18n.t("hooks.smartThingsDevices.syncError"),
        description: error.message || i18n.t("hooks.smartThingsControl.tryAgain"),
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
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
