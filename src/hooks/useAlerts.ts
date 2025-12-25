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
        async (payload) => {
          const newAlert = payload.new as Alert;
          if (!newAlert.is_dismissed) {
            setAlerts((prev) => [newAlert, ...prev]);
            toast({
              title: newAlert.type === "critical" ? i18n.t('hooks.alerts.criticalAlert') : i18n.t('hooks.alerts.newAlert'),
              description: newAlert.message,
              variant: newAlert.type === "critical" ? "destructive" : "default",
            });

            // Send email for critical alerts if email notifications are enabled
            if (newAlert.type === "critical") {
              try {
                // Check if email notifications are enabled
                const { data: alertSettings } = await supabase
                  .from("alert_settings")
                  .select("email_notifications")
                  .eq("workspace_id", currentWorkspaceId)
                  .single();

                if (alertSettings?.email_notifications) {
                  // Get workspace admins/owners emails
                  const { data: members } = await supabase
                    .from("workspace_members")
                    .select("user_id, role")
                    .eq("workspace_id", currentWorkspaceId)
                    .in("role", ["owner", "admin"]);

                  if (members && members.length > 0) {
                    const userIds = members.map(m => m.user_id);
                    const { data: profiles } = await supabase
                      .from("profiles")
                      .select("email")
                      .in("id", userIds);

                    // Get workspace name
                    const { data: workspace } = await supabase
                      .from("workspaces")
                      .select("name")
                      .eq("id", currentWorkspaceId)
                      .single();

                    // Get equipment info if available
                    let equipmentName = "Equipamento desconhecido";
                    if (newAlert.equipment_id) {
                      const { data: equipment } = await supabase
                        .from("equipments")
                        .select("name, current_temp, efficiency")
                        .eq("id", newAlert.equipment_id)
                        .single();
                      if (equipment) {
                        equipmentName = equipment.name;

                        // Get alert thresholds
                        const { data: thresholds } = await supabase
                          .from("alert_settings")
                          .select("temp_alert_min, temp_alert_max, efficiency_threshold")
                          .eq("workspace_id", currentWorkspaceId)
                          .single();

                        // Send emails to all admins/owners
                        for (const profile of profiles || []) {
                          const emailType = newAlert.message.toLowerCase().includes("temperatura") 
                            ? "temperature_alert" 
                            : "efficiency_alert";

                          await supabase.functions.invoke('send-email', {
                            body: {
                              type: emailType,
                              to: profile.email,
                              language: i18n.language || 'pt-BR',
                              data: {
                                workspaceName: workspace?.name || 'Workspace',
                                equipmentName,
                                currentTemp: equipment.current_temp?.toString(),
                                efficiency: equipment.efficiency?.toString(),
                                minTemp: thresholds?.temp_alert_min?.toString() || '16',
                                maxTemp: thresholds?.temp_alert_max?.toString() || '28',
                                threshold: thresholds?.efficiency_threshold?.toString() || '85',
                              },
                            },
                          });
                        }
                        console.log('Alert emails sent successfully');
                      }
                    }
                  }
                }
              } catch (emailError) {
                console.error('Failed to send alert email:', emailError);
              }
            }
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
