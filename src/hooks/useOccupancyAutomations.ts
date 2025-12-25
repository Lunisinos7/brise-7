import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import i18n from "@/lib/i18n";
import { Environment } from "@/contexts/EnvironmentContext";

export interface OccupancyAutomation {
  id: string;
  name: string;
  workspace_id: string;
  is_active: boolean;
  inactivity_timeout_minutes: number;
  reactivation_enabled: boolean;
  respect_time_routines: boolean;
  created_at: string;
  updated_at: string;
  environments: {
    id: string;
    name: string;
    equipment_ids: string[];
  }[];
}

export interface CreateOccupancyAutomationInput {
  name: string;
  workspaceId: string;
  inactivityTimeoutMinutes: number;
  reactivationEnabled: boolean;
  respectTimeRoutines: boolean;
  environmentIds: string[];
}

export interface UpdateOccupancyAutomationInput extends CreateOccupancyAutomationInput {
  id: string;
}

export const useOccupancyAutomations = (workspaceId?: string) => {
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["occupancy-automations", workspaceId],
    queryFn: async (): Promise<OccupancyAutomation[]> => {
      if (!workspaceId) return [];

      // Fetch automations filtered by workspace
      const { data: automationsData, error: automationsError } = await supabase
        .from("occupancy_automations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (automationsError) throw automationsError;

      // Fetch environments for each automation
      const automationsWithEnvironments = await Promise.all(
        (automationsData || []).map(async (automation) => {
          const { data: envLinks } = await supabase
            .from("occupancy_automation_environments")
            .select("environment_id")
            .eq("automation_id", automation.id);

          const environmentIds = (envLinks || []).map((e) => e.environment_id);

          // Fetch environment details
          const { data: environments } = await supabase
            .from("environments")
            .select("id, name, equipment_ids")
            .in("id", environmentIds.length > 0 ? environmentIds : ["00000000-0000-0000-0000-000000000000"]);

          return {
            ...automation,
            environments: (environments || []).map((env) => ({
              id: env.id,
              name: env.name,
              equipment_ids: env.equipment_ids || [],
            })),
          };
        })
      );

      return automationsWithEnvironments;
    },
    enabled: !!workspaceId,
  });

  const addAutomation = useMutation({
    mutationFn: async (input: CreateOccupancyAutomationInput) => {
      // 1. Create the automation
      const { data: automation, error: automationError } = await supabase
        .from("occupancy_automations")
        .insert({
          name: input.name,
          workspace_id: input.workspaceId,
          inactivity_timeout_minutes: input.inactivityTimeoutMinutes,
          reactivation_enabled: input.reactivationEnabled,
          respect_time_routines: input.respectTimeRoutines,
        })
        .select()
        .single();

      if (automationError) throw automationError;

      // 2. Create environment associations
      if (input.environmentIds.length > 0) {
        const environmentInserts = input.environmentIds.map((envId) => ({
          automation_id: automation.id,
          environment_id: envId,
        }));

        const { error: envsError } = await supabase
          .from("occupancy_automation_environments")
          .insert(environmentInserts);

        if (envsError) throw envsError;
      }

      return automation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy-automations", workspaceId] });
      toast({
        title: i18n.t("hooks.occupancyAutomations.created"),
        description: i18n.t("hooks.occupancyAutomations.createdDesc"),
      });
    },
    onError: (error) => {
      toast({
        title: i18n.t("hooks.occupancyAutomations.createError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAutomation = useMutation({
    mutationFn: async (input: UpdateOccupancyAutomationInput) => {
      // 1. Update the automation
      const { error: automationError } = await supabase
        .from("occupancy_automations")
        .update({
          name: input.name,
          inactivity_timeout_minutes: input.inactivityTimeoutMinutes,
          reactivation_enabled: input.reactivationEnabled,
          respect_time_routines: input.respectTimeRoutines,
        })
        .eq("id", input.id);

      if (automationError) throw automationError;

      // 2. Delete existing environment associations
      await supabase
        .from("occupancy_automation_environments")
        .delete()
        .eq("automation_id", input.id);

      // 3. Create new environment associations
      if (input.environmentIds.length > 0) {
        const environmentInserts = input.environmentIds.map((envId) => ({
          automation_id: input.id,
          environment_id: envId,
        }));

        const { error: envsError } = await supabase
          .from("occupancy_automation_environments")
          .insert(environmentInserts);

        if (envsError) throw envsError;
      }

      return input.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy-automations", workspaceId] });
      toast({
        title: i18n.t("hooks.occupancyAutomations.updated"),
        description: i18n.t("hooks.occupancyAutomations.updatedDesc"),
      });
    },
    onError: (error) => {
      toast({
        title: i18n.t("hooks.occupancyAutomations.updateError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("occupancy_automations")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy-automations", workspaceId] });
    },
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("occupancy_automations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy-automations", workspaceId] });
      toast({
        title: i18n.t("hooks.occupancyAutomations.deleted"),
        description: i18n.t("hooks.occupancyAutomations.deletedDesc"),
      });
    },
    onError: (error) => {
      toast({
        title: i18n.t("hooks.occupancyAutomations.deleteError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    automations,
    isLoading,
    addAutomation,
    updateAutomation,
    toggleAutomation,
    deleteAutomation,
  };
};
