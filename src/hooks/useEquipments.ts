import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Equipment {
  id: string;
  name: string;
  location: string;
  model: string;
  capacity: number;
  integration: "BRISE" | "SMART";
  isOn: boolean;
  currentTemp: number;
  targetTemp: number;
  mode: "cool" | "heat" | "auto" | "fan";
  energyConsumption: number;
  efficiency: number;
  smartthings_device_id?: string | null;
  smartthings_capabilities?: any;
  last_synced_at?: string | null;
}

interface DbEquipment {
  id: string;
  name: string;
  location: string;
  model: string;
  capacity: number;
  integration: string;
  is_on: boolean;
  current_temp: number;
  target_temp: number;
  mode: string;
  energy_consumption: number;
  efficiency: number;
  created_at: string;
  updated_at: string;
  smartthings_device_id?: string | null;
  smartthings_capabilities?: any;
  last_synced_at?: string | null;
}

const mapDbToEquipment = (db: DbEquipment): Equipment => ({
  id: db.id,
  name: db.name,
  location: db.location,
  model: db.model,
  capacity: db.capacity,
  integration: db.integration as "BRISE" | "SMART",
  isOn: db.is_on,
  currentTemp: db.current_temp,
  targetTemp: db.target_temp,
  mode: db.mode as "cool" | "heat" | "auto" | "fan",
  energyConsumption: db.energy_consumption,
  efficiency: db.efficiency,
  smartthings_device_id: db.smartthings_device_id,
  smartthings_capabilities: db.smartthings_capabilities,
  last_synced_at: db.last_synced_at,
});

const mapEquipmentToDb = (eq: Equipment) => ({
  id: eq.id,
  name: eq.name,
  location: eq.location,
  model: eq.model,
  capacity: eq.capacity,
  integration: eq.integration,
  is_on: eq.isOn,
  current_temp: eq.currentTemp,
  target_temp: eq.targetTemp,
  mode: eq.mode,
  energy_consumption: eq.energyConsumption,
  efficiency: eq.efficiency,
  smartthings_device_id: eq.smartthings_device_id,
  smartthings_capabilities: eq.smartthings_capabilities,
  last_synced_at: eq.last_synced_at,
});

export function useEquipments() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from("equipments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEquipments((data as DbEquipment[]).map(mapDbToEquipment));
    } catch (error) {
      console.error("Error fetching equipments:", error);
      toast({
        title: "Erro ao carregar equipamentos",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addEquipment = async (equipment: Omit<Equipment, "id">) => {
    try {
      const dbEquipment = {
        name: equipment.name,
        location: equipment.location,
        model: equipment.model,
        capacity: equipment.capacity,
        integration: equipment.integration,
        is_on: equipment.isOn,
        current_temp: equipment.currentTemp,
        target_temp: equipment.targetTemp,
        mode: equipment.mode,
        energy_consumption: equipment.energyConsumption,
        efficiency: equipment.efficiency,
      };

      const { data, error } = await supabase
        .from("equipments")
        .insert(dbEquipment)
        .select()
        .single();

      if (error) throw error;

      const newEquipment = mapDbToEquipment(data as DbEquipment);
      setEquipments((prev) => [newEquipment, ...prev]);

      return newEquipment;
    } catch (error) {
      console.error("Error adding equipment:", error);
      throw error;
    }
  };

  const updateEquipment = async (equipment: Equipment) => {
    try {
      const dbEquipment = mapEquipmentToDb(equipment);

      const { error } = await supabase
        .from("equipments")
        .update(dbEquipment)
        .eq("id", equipment.id);

      if (error) throw error;

      setEquipments((prev) =>
        prev.map((eq) => (eq.id === equipment.id ? equipment : eq))
      );
    } catch (error) {
      console.error("Error updating equipment:", error);
      throw error;
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("equipments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEquipments((prev) => prev.filter((eq) => eq.id !== id));
    } catch (error) {
      console.error("Error deleting equipment:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  return {
    equipments,
    isLoading,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    refetch: fetchEquipments,
  };
}
