import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WorkspaceSettings {
  id: string;
  workspace_id: string;
  kwh_rate: number;
  currency_symbol: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
}

export const useWorkspaceSettings = (workspaceId: string | null) => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["workspace-settings", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .from("workspace_settings")
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (error) throw error;
      return data as WorkspaceSettings | null;
    },
    enabled: !!workspaceId,
  });

  const upsertSettings = useMutation({
    mutationFn: async (updates: { kwh_rate: number; currency_symbol: string; currency_code: string }) => {
      if (!workspaceId) throw new Error("No workspace selected");

      // Check if settings exist
      const { data: existing } = await supabase
        .from("workspace_settings")
        .select("id")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("workspace_settings")
          .update({
            kwh_rate: updates.kwh_rate,
            currency_symbol: updates.currency_symbol,
            currency_code: updates.currency_code,
          })
          .eq("workspace_id", workspaceId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("workspace_settings")
          .insert({
            workspace_id: workspaceId,
            kwh_rate: updates.kwh_rate,
            currency_symbol: updates.currency_symbol,
            currency_code: updates.currency_code,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-settings", workspaceId] });
    },
  });

  // Return default values if no settings exist
  const effectiveSettings = settings || {
    kwh_rate: 0.70,
    currency_symbol: "R$",
    currency_code: "BRL",
  };

  return {
    settings: effectiveSettings,
    isLoading,
    error,
    upsertSettings,
  };
};
