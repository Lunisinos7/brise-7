import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { SmartThingsDevice } from "@/lib/smartthings";

export function useSmartThingsDevices() {
  const [devices, setDevices] = useState<SmartThingsDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspaceContext();

  const discoverDevices = async (): Promise<SmartThingsDevice[]> => {
    if (!currentWorkspaceId) {
      toast({
        title: "Erro",
        description: "Nenhum workspace selecionado.",
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
        title: "Erro ao buscar dispositivos",
        description: error.message || "Verifique a configuração do SmartThings.",
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
        title: "Erro",
        description: "Nenhum workspace selecionado.",
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
        title: "Sincronizado",
        description: "Dispositivo sincronizado com sucesso!",
      });

      return true;
    } catch (error: any) {
      console.error("Error syncing device:", error);
      toast({
        title: "Erro ao sincronizar",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const syncAllDevices = async (): Promise<boolean> => {
    if (!currentWorkspaceId) {
      toast({
        title: "Erro",
        description: "Nenhum workspace selecionado.",
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
        title: "Sincronização concluída",
        description: `${successCount} dispositivo(s) sincronizado(s).`,
      });

      return true;
    } catch (error: any) {
      console.error("Error syncing all devices:", error);
      toast({
        title: "Erro ao sincronizar",
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
