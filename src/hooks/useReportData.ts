import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subHours, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import i18n from "@/lib/i18n";

export type PeriodType = "24h" | "week" | "month" | "quarter" | "semester" | "year" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface EnergyHistoryItem {
  id: string;
  equipment_id: string;
  energy_consumption: number;
  is_on: boolean;
  recorded_at: string;
}

export interface TemperatureHistoryItem {
  id: string;
  equipment_id: string;
  current_temp: number;
  target_temp: number;
  mode: string;
  recorded_at: string;
}

export interface AggregatedEnergyData {
  date: string;
  consumption: number;
}

export interface EquipmentExpense {
  equipment_id: string;
  equipment_name: string;
  total_kwh: number;
  total_expense: number;
}

export interface TemperatureData {
  date: string;
  current_temp: number;
  target_temp: number;
}

export interface UsagePattern {
  hour: number;
  dayOfWeek: string;
  usage: number;
}

export const getDateRangeFromPeriod = (period: PeriodType, customRange?: DateRange): DateRange => {
  const now = new Date();
  
  switch (period) {
    case "24h":
      return { from: subHours(now, 24), to: now };
    case "week":
      return { from: subDays(now, 7), to: now };
    case "month":
      return { from: subMonths(now, 1), to: now };
    case "quarter":
      return { from: subMonths(now, 3), to: now };
    case "semester":
      return { from: subMonths(now, 6), to: now };
    case "year":
      return { from: subMonths(now, 12), to: now };
    case "custom":
      return customRange || { from: subMonths(now, 1), to: now };
    default:
      return { from: subMonths(now, 1), to: now };
  }
};

export const useEnergyHistory = (dateRange: DateRange, equipmentIds?: string[]) => {
  return useQuery({
    queryKey: ["energy-history", dateRange.from.toISOString(), dateRange.to.toISOString(), equipmentIds],
    queryFn: async () => {
      if (equipmentIds && equipmentIds.length === 0) return [];
      
      let query = supabase
        .from("energy_history")
        .select("*")
        .gte("recorded_at", dateRange.from.toISOString())
        .lte("recorded_at", dateRange.to.toISOString())
        .order("recorded_at", { ascending: true });

      if (equipmentIds && equipmentIds.length > 0) {
        query = query.in("equipment_id", equipmentIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EnergyHistoryItem[];
    },
  });
};

export const useTemperatureHistory = (dateRange: DateRange, equipmentIds?: string[]) => {
  return useQuery({
    queryKey: ["temperature-history", dateRange.from.toISOString(), dateRange.to.toISOString(), equipmentIds],
    queryFn: async () => {
      if (equipmentIds && equipmentIds.length === 0) return [];
      
      let query = supabase
        .from("temperature_history")
        .select("*")
        .gte("recorded_at", dateRange.from.toISOString())
        .lte("recorded_at", dateRange.to.toISOString())
        .order("recorded_at", { ascending: true });

      if (equipmentIds && equipmentIds.length > 0) {
        query = query.in("equipment_id", equipmentIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TemperatureHistoryItem[];
    },
  });
};

export const useAggregatedEnergyData = (dateRange: DateRange, equipmentIds?: string[]) => {
  const { data: rawData, ...rest } = useEnergyHistory(dateRange, equipmentIds);

  const aggregatedData: AggregatedEnergyData[] = [];
  
  if (rawData) {
    const groupedByDate = rawData.reduce((acc, item) => {
      const date = startOfDay(new Date(item.recorded_at)).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { consumptions: [] };
      }
      acc[date].consumptions.push(Number(item.energy_consumption));
      return acc;
    }, {} as Record<string, { consumptions: number[] }>);

    Object.entries(groupedByDate).forEach(([date, values]) => {
      aggregatedData.push({
        date,
        consumption: values.consumptions.reduce((a, b) => a + b, 0),
      });
    });
  }

  return { data: aggregatedData, ...rest };
};

export const useEquipmentExpense = (dateRange: DateRange, equipmentIds?: string[], kwhRate: number = 0.70) => {
  const { data: energyData, ...energyRest } = useEnergyHistory(dateRange, equipmentIds);
  
  return useQuery({
    queryKey: ["equipment-expense", dateRange.from.toISOString(), dateRange.to.toISOString(), equipmentIds, kwhRate],
    queryFn: async () => {
      let query = supabase.from("equipments").select("id, name");
      
      if (equipmentIds && equipmentIds.length > 0) {
        query = query.in("id", equipmentIds);
      }

      const { data: equipments, error } = await query;

      if (error) throw error;

      const consumptionMap = new Map<string, number[]>();
      
      energyData?.forEach((item) => {
        if (!consumptionMap.has(item.equipment_id)) {
          consumptionMap.set(item.equipment_id, []);
        }
        consumptionMap.get(item.equipment_id)!.push(Number(item.energy_consumption));
      });

      const result: EquipmentExpense[] = equipments?.map((eq) => {
        const consumptions = consumptionMap.get(eq.id) || [];
        const totalKwh = consumptions.reduce((a, b) => a + b, 0);
        return {
          equipment_id: eq.id,
          equipment_name: eq.name,
          total_kwh: totalKwh,
          total_expense: totalKwh * kwhRate,
        };
      }) || [];

      return result.sort((a, b) => b.total_expense - a.total_expense);
    },
    enabled: !!energyData,
  });
};

export const useAggregatedTemperatureData = (dateRange: DateRange, equipmentIds?: string[]) => {
  const { data: rawData, ...rest } = useTemperatureHistory(dateRange, equipmentIds);

  const aggregatedData: TemperatureData[] = [];
  
  if (rawData) {
    const groupedByDate = rawData.reduce((acc, item) => {
      const date = startOfDay(new Date(item.recorded_at)).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { currentTemps: [], targetTemps: [] };
      }
      acc[date].currentTemps.push(Number(item.current_temp));
      acc[date].targetTemps.push(Number(item.target_temp));
      return acc;
    }, {} as Record<string, { currentTemps: number[]; targetTemps: number[] }>);

    Object.entries(groupedByDate).forEach(([date, values]) => {
      aggregatedData.push({
        date,
        current_temp: values.currentTemps.reduce((a, b) => a + b, 0) / values.currentTemps.length,
        target_temp: values.targetTemps.reduce((a, b) => a + b, 0) / values.targetTemps.length,
      });
    });
  }

  return { data: aggregatedData, ...rest };
};

export const useUsagePatterns = (dateRange: DateRange, equipmentIds?: string[]) => {
  const { data: rawData, ...rest } = useEnergyHistory(dateRange, equipmentIds);

  const patterns: UsagePattern[] = [];
  
  // Use translated weekday names
  const getDaysOfWeek = () => [
    i18n.t("weekdays.short.sun"),
    i18n.t("weekdays.short.mon"),
    i18n.t("weekdays.short.tue"),
    i18n.t("weekdays.short.wed"),
    i18n.t("weekdays.short.thu"),
    i18n.t("weekdays.short.fri"),
    i18n.t("weekdays.short.sat"),
  ];
  
  const daysOfWeek = getDaysOfWeek();
  
  if (rawData) {
    const usageMap = new Map<string, number[]>();
    
    rawData.forEach((item) => {
      if (item.is_on) {
        const date = new Date(item.recorded_at);
        const hour = date.getHours();
        const dayOfWeek = daysOfWeek[date.getDay()];
        const key = `${dayOfWeek}-${hour}`;
        
        if (!usageMap.has(key)) {
          usageMap.set(key, []);
        }
        usageMap.get(key)!.push(1);
      }
    });

    daysOfWeek.forEach((day) => {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        const usages = usageMap.get(key) || [];
        patterns.push({
          hour,
          dayOfWeek: day,
          usage: usages.length,
        });
      }
    });
  }

  return { data: patterns, ...rest };
};

export const useReportSummary = (
  dateRange: DateRange, 
  equipmentIds?: string[],
  kwhRate: number = 0.70,
  currencySymbol: string = "R$"
) => {
  const { data: energyData, isLoading } = useEnergyHistory(dateRange, equipmentIds);
  
  // Use useMemo to avoid recalculating on every render
  const summary = React.useMemo(() => {
    if (!energyData || energyData.length === 0) {
      return {
        totalConsumption: 0,
        totalSpent: 0,
        currencySymbol,
      };
    }

    // energy_consumption is already stored in kWh from the edge function
    const totalConsumption = energyData.reduce((acc, item) => acc + Number(item.energy_consumption), 0);
    
    // Gasto total (consumo × tarifa)
    const totalSpent = totalConsumption * kwhRate;

    return {
      totalConsumption,
      totalSpent,
      currencySymbol,
    };
  }, [energyData, kwhRate, currencySymbol]);

  return {
    ...summary,
    isLoading,
  };
};
