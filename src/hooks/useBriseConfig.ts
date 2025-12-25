import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import type { BriseConfig } from "@/lib/brise";
import i18n from "@/lib/i18n";

export function useBriseConfig() {
  const [config, setConfig] = useState<BriseConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspaceContext();

  const fetchConfig = useCallback(async () => {
    if (!currentWorkspaceId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("brise_config")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      setConfig(data as BriseConfig | null);
      setIsConfigured(!!data);
    } catch (error) {
      console.error("Error fetching BRISE config:", error);
      setConfig(null);
      setIsConfigured(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!currentWorkspaceId) {
      toast({
        title: i18n.t("common.error"),
        description: i18n.t("brise.noWorkspace"),
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke("brise-auth", {
        body: { action: "login", email, password, workspaceId: currentWorkspaceId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: i18n.t("brise.loginSuccess"),
        description: i18n.t("brise.loginSuccessDesc"),
      });

      await fetchConfig();
      return true;
    } catch (error: any) {
      console.error("BRISE login error:", error);
      toast({
        title: i18n.t("brise.loginError"),
        description: error.message || i18n.t("brise.loginErrorDesc"),
        variant: "destructive",
      });
      return false;
    }
  };

  const disconnect = async (): Promise<boolean> => {
    if (!currentWorkspaceId) return false;

    try {
      const { data, error } = await supabase.functions.invoke("brise-auth", {
        body: { action: "disconnect", workspaceId: currentWorkspaceId },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setConfig(null);
      setIsConfigured(false);

      toast({
        title: i18n.t("brise.disconnected"),
        description: i18n.t("brise.disconnectedDesc"),
      });

      return true;
    } catch (error: any) {
      console.error("BRISE disconnect error:", error);
      toast({
        title: i18n.t("common.error"),
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    config,
    isLoading,
    isConfigured,
    login,
    disconnect,
    refetch: fetchConfig,
  };
}
