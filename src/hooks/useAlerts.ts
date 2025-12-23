import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import i18n from "@/lib/i18n";

export interface Alert {
  id: string;
  workspace_id: string;
  equipment_id: string | null;
  type: "critical" | "warning" | "info";
  message: string;
  is_dismissed: boolean;
  dismissed_by: string | null;
  dismissed_at: string | null;
  created_at: string;
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspaceContext();

  const fetchAlerts = useCallback(async () => {
    if (!currentWorkspaceId) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts((data as Alert[]) || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast({
        title: i18n.t('common.error'),
        description: i18n.t('hooks.alerts.loadError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspaceId, toast]);

  const dismissAlert = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("alerts")
        .update({
          is_dismissed: true,
          dismissed_by: user?.id,
          dismissed_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;

      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      toast({
        title: i18n.t('hooks.alerts.alertDismissed'),
        description: i18n.t('hooks.alerts.alertDismissedDesc'),
      });
    } catch (error) {
      console.error("Error dismissing alert:", error);
      toast({
        title: i18n.t('common.error'),
        description: i18n.t('hooks.alerts.dismissError'),
        variant: "destructive",
      });
    }
  };

  const clearAllAlerts = async () => {
    if (!currentWorkspaceId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("alerts")
        .update({
          is_dismissed: true,
          dismissed_by: user?.id,
          dismissed_at: new Date().toISOString(),
        })
        .eq("workspace_id", currentWorkspaceId)
        .eq("is_dismissed", false);

      if (error) throw error;

      setAlerts([]);
      toast({
        title: i18n.t('hooks.alerts.alertsCleared'),
        description: i18n.t('hooks.alerts.alertsClearedDesc'),
      });
    } catch (error) {
      console.error("Error clearing alerts:", error);
      toast({
        title: i18n.t('common.error'),
        description: i18n.t('hooks.alerts.clearError'),
        variant: "destructive",
      });
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    if (!currentWorkspaceId) return;

    const channel = supabase
      .channel("alerts-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        (payload) => {
          const newAlert = payload.new as Alert;
          if (!newAlert.is_dismissed) {
            setAlerts((prev) => [newAlert, ...prev]);
            toast({
              title: newAlert.type === "critical" ? i18n.t('hooks.alerts.criticalAlert') : i18n.t('hooks.alerts.newAlert'),
              description: newAlert.message,
              variant: newAlert.type === "critical" ? "destructive" : "default",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, toast]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    isLoading,
    dismissAlert,
    clearAllAlerts,
    refetch: fetchAlerts,
  };
};
