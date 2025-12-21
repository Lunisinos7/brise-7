import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Environment {
  id: string;
  name: string;
  equipmentIds: string[];
}

interface DbEnvironment {
  id: string;
  name: string;
  equipment_ids: string[];
  created_at: string;
  updated_at: string;
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
});

export const EnvironmentProvider = ({ children }: { children: ReactNode }) => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnvironments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("environments")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching environments:", error);
        toast.error("Erro ao carregar ambientes");
        return;
      }

      setEnvironments((data || []).map(mapDbToEnvironment));
    } catch (error) {
      console.error("Error fetching environments:", error);
      toast.error("Erro ao carregar ambientes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const addEnvironment = async (environment: Omit<Environment, "id">): Promise<Environment | null> => {
    try {
      const { data, error } = await supabase
        .from("environments")
        .insert({
          name: environment.name,
          equipment_ids: environment.equipmentIds,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding environment:", error);
        toast.error("Erro ao criar ambiente");
        return null;
      }

      const newEnvironment = mapDbToEnvironment(data);
      setEnvironments(prev => [...prev, newEnvironment]);
      return newEnvironment;
    } catch (error) {
      console.error("Error adding environment:", error);
      toast.error("Erro ao criar ambiente");
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
        toast.error("Erro ao excluir ambiente");
        return;
      }

      setEnvironments(prev => prev.filter(env => env.id !== id));
    } catch (error) {
      console.error("Error removing environment:", error);
      toast.error("Erro ao excluir ambiente");
    }
  };

  const updateEnvironment = async (id: string, updates: Partial<Omit<Environment, "id">>) => {
    try {
      const dbUpdates: Partial<DbEnvironment> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.equipmentIds !== undefined) dbUpdates.equipment_ids = updates.equipmentIds;

      const { error } = await supabase
        .from("environments")
        .update(dbUpdates)
        .eq("id", id);

      if (error) {
        console.error("Error updating environment:", error);
        toast.error("Erro ao atualizar ambiente");
        return;
      }

      setEnvironments(prev =>
        prev.map(env => (env.id === id ? { ...env, ...updates } : env))
      );
    } catch (error) {
      console.error("Error updating environment:", error);
      toast.error("Erro ao atualizar ambiente");
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
