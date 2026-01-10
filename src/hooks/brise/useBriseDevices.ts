import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { BriseDevice } from "@/lib/brise";
import i18n from "@/lib/i18n";

export function useBriseDevices() {
  const [devices, setDevices] = useState<BriseDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspaceContext();

  const discoverDevices = async (): Promise<BriseDevice[]> => {
    if (!currentWorkspaceId) {
      toast({
        title: i18n.t("common.error"),
        description: i18n.t("brise.noWorkspace"),
        variant: "destructive",
      });
      return [];
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("brise-devices", {
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
      console.error("Error discovering BRISE devices:", error);
      toast({
        title: i18n.t("brise.discoverError"),
        description: error.message || i18n.t("brise.checkConfig"),
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    devices,
    isLoading,
    discoverDevices,
  };
}
