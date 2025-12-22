import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay } from "date-fns";
import { useWorkspaceSettings } from "./useWorkspaceSettings";

interface AccumulatedExpenseData {
  totalKwh: number;
  totalCost: number;
  currencySymbol: string;
}

export const useAccumulatedExpense = (workspaceId: string | null, equipmentIds?: string[]) => {
  const { settings } = useWorkspaceSettings(workspaceId);

  const { data, isLoading, error } = useQuery({
    queryKey: ["accumulated-expense", workspaceId, equipmentIds, settings?.kwh_rate],
    queryFn: async (): Promise<AccumulatedExpenseData> => {
      if (!workspaceId) {
        return {
          totalKwh: 0,
          totalCost: 0,
          currencySymbol: settings?.currency_symbol || "R$",
        };
      }

      const today = startOfDay(new Date());

      // Try to get historical data from energy_history
      let query = supabase
        .from("energy_history")
        .select("energy_consumption")
        .gte("recorded_at", today.toISOString());

      if (equipmentIds && equipmentIds.length > 0) {
        query = query.in("equipment_id", equipmentIds);
      }

      const { data: historyData, error: historyError } = await query;

      if (historyError) throw historyError;

      let totalKwh = 0;

      if (historyData && historyData.length > 0) {
        // Sum up historical consumption
        totalKwh = historyData.reduce((sum, item) => sum + Number(item.energy_consumption), 0) / 1000;
      } else {
        // Fallback: estimate from current equipment consumption
        let equipmentQuery = supabase
          .from("equipments")
          .select("energy_consumption, is_on")
          .eq("workspace_id", workspaceId);

        if (equipmentIds && equipmentIds.length > 0) {
          equipmentQuery = equipmentQuery.in("id", equipmentIds);
        }

        const { data: equipmentData, error: equipmentError } = await equipmentQuery;

        if (equipmentError) throw equipmentError;

        if (equipmentData) {
          // Calculate hours since midnight
          const now = new Date();
          const hoursSinceMidnight = now.getHours() + now.getMinutes() / 60;
          
          // Sum current consumption of active equipment and estimate accumulated
          const currentConsumption = equipmentData
            .filter(eq => eq.is_on)
            .reduce((sum, eq) => sum + Number(eq.energy_consumption), 0);
          
          // Estimate: current consumption * hours (simplified)
          totalKwh = (currentConsumption * hoursSinceMidnight) / 1000;
        }
      }

      const rate = settings?.kwh_rate || 0.70;
      const totalCost = totalKwh * rate;

      return {
        totalKwh,
        totalCost,
        currencySymbol: settings?.currency_symbol || "R$",
      };
    },
    enabled: !!workspaceId,
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    data: data || { totalKwh: 0, totalCost: 0, currencySymbol: "R$" },
    isLoading,
    error,
  };
};
