import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";

export interface AlertSettings {
  id: string;
  workspace_id: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  temp_alert_min: number;
  temp_alert_max: number;
  efficiency_threshold: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS: Omit<AlertSettings, "id" | "workspace_id" | "created_at" | "updated_at"> = {
  notifications_enabled: true,
  email_notifications: true,
  temp_alert_min: 16,
  temp_alert_max: 28,
  efficiency_threshold: 85,
};

export const useAlertSettings = () => {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { currentWorkspaceId, canManageWorkspace } = useWorkspaceContext();

  const fetchSettings = useCallback(async () => {
    if (!currentWorkspaceId) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("alert_settings")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .maybeSingle();

      if (error) throw error;
      
      setSettings(data as AlertSettings | null);
    } catch (error) {
      console.error("Error fetching alert settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de alerta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspaceId, toast]);

  const updateSettings = async (updates: Partial<AlertSettings>) => {
    if (!currentWorkspaceId || !canManageWorkspace) return;

    try {
      setIsSaving(true);

      if (settings) {
        // Update existing settings
        const { data, error } = await supabase
          .from("alert_settings")
          .update(updates)
          .eq("id", settings.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data as AlertSettings);
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from("alert_settings")
          .insert({
            workspace_id: currentWorkspaceId,
            ...DEFAULT_SETTINGS,
            ...updates,
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(data as AlertSettings);
      }

      toast({
        title: "Configurações Salvas",
        description: "As configurações de alerta foram atualizadas.",
      });
    } catch (error) {
      console.error("Error updating alert settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Return settings with defaults if not yet created
  const effectiveSettings = settings || {
    ...DEFAULT_SETTINGS,
    id: "",
    workspace_id: currentWorkspaceId || "",
    created_at: "",
    updated_at: "",
  };

  return {
    settings: effectiveSettings,
    isLoading,
    isSaving,
    updateSettings,
    refetch: fetchSettings,
  };
};
