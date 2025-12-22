import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, Calendar, Zap } from "lucide-react";
import { PeriodSelector } from "@/components/reports/PeriodSelector";
import { ExportDialog } from "@/components/reports/ExportDialog";
import { EnergyConsumptionChart } from "@/components/reports/EnergyConsumptionChart";
import { EfficiencyChart } from "@/components/reports/EfficiencyChart";
import { TemperatureChart } from "@/components/reports/TemperatureChart";
import { UsagePatternsChart } from "@/components/reports/UsagePatternsChart";
import {
  PeriodType,
  DateRange,
  getDateRangeFromPeriod,
  useAggregatedEnergyData,
  useEquipmentEfficiency,
  useAggregatedTemperatureData,
  useUsagePatterns,
  useReportSummary,
} from "@/hooks/useReportData";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useEquipments } from "@/hooks/useEquipments";
import { useWorkspaceSettings } from "@/hooks/useWorkspaceSettings";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);

  const { currentWorkspaceId } = useWorkspaceContext();
  const { equipments } = useEquipments(currentWorkspaceId);
  const { settings } = useWorkspaceSettings(currentWorkspaceId);
  const equipmentIds = equipments.map(eq => eq.id);

  const dateRange = getDateRangeFromPeriod(selectedPeriod, customRange);

  const { data: energyData = [], isLoading: isLoadingEnergy } = useAggregatedEnergyData(dateRange, equipmentIds);
  const { data: equipmentEfficiency = [], isLoading: isLoadingEfficiency } = useEquipmentEfficiency(dateRange, equipmentIds);
  const { data: temperatureData = [], isLoading: isLoadingTemperature } = useAggregatedTemperatureData(dateRange, equipmentIds);
  const { data: usagePatterns = [], isLoading: isLoadingUsage } = useUsagePatterns(dateRange, equipmentIds);
  const summary = useReportSummary(
    dateRange, 
    equipmentIds, 
    settings.kwh_rate, 
    settings.currency_symbol
  );

  const handlePeriodChange = (period: PeriodType, range?: DateRange) => {
    setSelectedPeriod(period);
    if (range) {
      setCustomRange(range);
    }
    setPeriodPopoverOpen(false);
  };

  const periodLabels: Record<PeriodType, string> = {
    "24h": "Últimas 24h",
    week: "Última Semana",
    month: "Último Mês",
    quarter: "Último Trimestre",
    semester: "Último Semestre",
    year: "Último Ano",
    custom: "Período Customizado",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e insights do sistema de climatização
          </p>
        </div>
        <div className="flex gap-2">
          <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {periodLabels[selectedPeriod]}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="end">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Selecione o Período</h4>
                <PeriodSelector
                  selectedPeriod={selectedPeriod}
                  customRange={customRange}
                  onPeriodChange={handlePeriodChange}
                />
              </div>
            </PopoverContent>
          </Popover>
          <ExportDialog
            energyData={energyData}
            temperatureData={temperatureData}
            equipmentEfficiency={equipmentEfficiency}
            summary={summary}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Consumo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalConsumption.toFixed(2)} kWh</div>
            <p className="text-sm text-muted-foreground">Período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Gasto ({summary.currencySymbol})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.currencySymbol} {summary.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-muted-foreground">Período selecionado</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnergyConsumptionChart data={energyData} isLoading={isLoadingEnergy} />
        <EfficiencyChart data={equipmentEfficiency} isLoading={isLoadingEfficiency} />
        <TemperatureChart data={temperatureData} isLoading={isLoadingTemperature} />
        <UsagePatternsChart data={usagePatterns} isLoading={isLoadingUsage} />
      </div>
    </div>
  );
};

export default Reports;
