import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWorkspaceContext } from "./WorkspaceContext";
import i18n from "@/lib/i18n";

export interface Environment {
  id: string;
  name: string;
  equipmentIds: string[];
  workspace_id?: string | null;
  isActive: boolean;
  // Setpoint fields
  isAutomatic: boolean;
  coolingEnabled: boolean;
  heatingEnabled: boolean;
  coolTriggerTemp: number;
  coolTargetTemp: number;
  heatTriggerTemp: number;
  heatTargetTemp: number;
}

interface DbEnvironment {
  id: string;
  name: string;
  equipment_ids: string[];
  created_at: string;
  updated_at: string;
  workspace_id?: string | null;
  is_active: boolean;
  is_automatic: boolean;
  cooling_enabled: boolean;
  heating_enabled: boolean;
  cool_trigger_temp: number;
  cool_target_temp: number;
  heat_trigger_temp: number;
  heat_target_temp: number;
}

interface EnvironmentContextType {
  environments: Environment[];
  isLoading: boolean;
  addEnvironment: (environment: Omit<Environment, "id">) => Promise<Environment | null>;
  removeEnvironment: (id: string) => Promise<void>;
  updateEnvironment: (id: string, updates: Partial<Omit<Environment, "id">>) => Promise<void>;
  refetch: () => Promise<void>;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

const mapDbToEnvironment = (db: DbEnvironment): Environment => ({
  id: db.id,
  name: db.name,
  equipmentIds: db.equipment_ids || [],
  workspace_id: db.workspace_id,
  isActive: db.is_active,
  isAutomatic: db.is_automatic,
  coolingEnabled: db.cooling_enabled,
  heatingEnabled: db.heating_enabled,
  coolTriggerTemp: Number(db.cool_trigger_temp),
  coolTargetTemp: Number(db.cool_target_temp),
  heatTriggerTemp: Number(db.heat_trigger_temp),
  heatTargetTemp: Number(db.heat_target_temp),
});

export const EnvironmentProvider = ({ children }: { children: ReactNode }) => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentWorkspaceId } = useWorkspaceContext();

  const fetchEnvironments = async () => {
    if (!currentWorkspaceId) {
      setEnvironments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("environments")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching environments:", error);
        toast.error(i18n.t("hooks.environments.loadError"));
        return;
      }

      setEnvironments((data || []).map(mapDbToEnvironment));
    } catch (error) {
      console.error("Error fetching environments:", error);
      toast.error(i18n.t("hooks.environments.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, [currentWorkspaceId]);

  const addEnvironment = async (environment: Omit<Environment, "id">): Promise<Environment | null> => {
    if (!currentWorkspaceId) {
      toast.error(i18n.t("hooks.environments.selectWorkspace"));
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("environments")
        .insert({
          name: environment.name,
          equipment_ids: environment.equipmentIds,
          workspace_id: currentWorkspaceId,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding environment:", error);
        toast.error(i18n.t("hooks.environments.createError"));
        return null;
      }

      const newEnvironment = mapDbToEnvironment(data);
      setEnvironments(prev => [...prev, newEnvironment]);
      return newEnvironment;
    } catch (error) {
      console.error("Error adding environment:", error);
      toast.error(i18n.t("hooks.environments.createError"));
      return null;
    }
  };

  const removeEnvironment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("environments")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error removing environment:", error);
        toast.error(i18n.t("hooks.environments.deleteError"));
        return;
      }

      setEnvironments(prev => prev.filter(env => env.id !== id));
    } catch (error) {
      console.error("Error removing environment:", error);
      toast.error(i18n.t("hooks.environments.deleteError"));
    }
  };

  const updateEnvironment = async (id: string, updates: Partial<Omit<Environment, "id">>) => {
    try {
      const dbUpdates: Partial<DbEnvironment> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.equipmentIds !== undefined) dbUpdates.equipment_ids = updates.equipmentIds;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.isAutomatic !== undefined) dbUpdates.is_automatic = updates.isAutomatic;
      if (updates.coolingEnabled !== undefined) dbUpdates.cooling_enabled = updates.coolingEnabled;
      if (updates.heatingEnabled !== undefined) dbUpdates.heating_enabled = updates.heatingEnabled;
      if (updates.coolTriggerTemp !== undefined) dbUpdates.cool_trigger_temp = updates.coolTriggerTemp;
      if (updates.coolTargetTemp !== undefined) dbUpdates.cool_target_temp = updates.coolTargetTemp;
      if (updates.heatTriggerTemp !== undefined) dbUpdates.heat_trigger_temp = updates.heatTriggerTemp;
      if (updates.heatTargetTemp !== undefined) dbUpdates.heat_target_temp = updates.heatTargetTemp;

      const { error } = await supabase
        .from("environments")
        .update(dbUpdates)
        .eq("id", id);

      if (error) {
        console.error("Error updating environment:", error);
        toast.error(i18n.t("hooks.environments.updateError"));
        return;
      }

      setEnvironments(prev =>
        prev.map(env => (env.id === id ? { ...env, ...updates } : env))
      );
    } catch (error) {
      console.error("Error updating environment:", error);
      toast.error(i18n.t("hooks.environments.updateError"));
    }
  };

  return (
    <EnvironmentContext.Provider
      value={{ environments, isLoading, addEnvironment, removeEnvironment, updateEnvironment, refetch: fetchEnvironments }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
};

export const useEnvironments = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error("useEnvironments must be used within an EnvironmentProvider");
  }
  return context;
};
