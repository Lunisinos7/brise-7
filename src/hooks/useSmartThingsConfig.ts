import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { SmartThingsConfig, SmartThingsLocation } from "@/lib/smartthings";

export function useSmartThingsConfig() {
  const [config, setConfig] = useState<SmartThingsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspaceContext();

  const fetchConfig = async () => {
    if (!currentWorkspaceId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("smartthings_config")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      setConfig(data as SmartThingsConfig | null);
      setIsConfigured(!!data);
    } catch (error) {
      console.error("Error fetching SmartThings config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async (token: string): Promise<{ 
    valid: boolean; 
    locations?: SmartThingsLocation[];
    error?: string;
  }> => {
    try {
      const { data, error } = await supabase.functions.invoke("smartthings-auth", {
        body: { action: "validate", token },
      });

      if (error) throw error;

      if (data.success) {
        return { 
          valid: true, 
          locations: data.locations.map((loc: any) => ({
            locationId: loc.locationId,
            name: loc.name,
          })),
        };
      }

      return { valid: false, error: data.error };
    } catch (error: any) {
      console.error("Error validating token:", error);
      return { valid: false, error: error.message };
    }
  };

  const saveConfig = async (token: string, locationId?: string): Promise<boolean> => {
    if (!currentWorkspaceId) {
      toast({
        title: "Erro",
        description: "Nenhum workspace selecionado.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // First validate the token
      const validation = await validateToken(token);
      
      if (!validation.valid) {
        toast({
          title: "Token inválido",
          description: validation.error || "Verifique o token e tente novamente.",
          variant: "destructive",
        });
        return false;
      }

      // Save to database via edge function (handles workspace auth)
      const { data, error } = await supabase.functions.invoke("smartthings-auth", {
        body: { 
          action: "save", 
          token, 
          locationId,
          workspaceId: currentWorkspaceId 
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erro ao salvar configuração");
      }

      await fetchConfig();
      
      toast({
        title: "Configuração salva",
        description: "SmartThings configurado com sucesso!",
      });

      return true;
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  const disconnectSmartThings = async (): Promise<boolean> => {
    try {
      if (!config?.id) return true;

      const { error } = await supabase
        .from("smartthings_config")
        .update({ is_active: false })
        .eq("id", config.id);

      if (error) throw error;

      setConfig(null);
      setIsConfigured(false);

      toast({
        title: "Desconectado",
        description: "SmartThings foi desconectado.",
      });

      return true;
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast({
        title: "Erro ao desconectar",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [currentWorkspaceId]);

  return {
    config,
    isLoading,
    isConfigured,
    validateToken,
    saveConfig,
    disconnectSmartThings,
    refetch: fetchConfig,
  };
}
