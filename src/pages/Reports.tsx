import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, Calendar, Zap, Building2, Check } from "lucide-react";
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
import { useEnvironments } from "@/contexts/EnvironmentContext";
import { Checkbox } from "@/components/ui/checkbox";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const [environmentPopoverOpen, setEnvironmentPopoverOpen] = useState(false);
  const [selectedEnvironmentIds, setSelectedEnvironmentIds] = useState<string[]>([]);

  const { currentWorkspaceId } = useWorkspaceContext();
  const { equipments } = useEquipments(currentWorkspaceId);
  const { settings } = useWorkspaceSettings(currentWorkspaceId);
  const { environments } = useEnvironments();

  // Filtrar equipmentIds baseado nos ambientes selecionados
  const filteredEquipmentIds = selectedEnvironmentIds.length > 0
    ? [...new Set(
        environments
          .filter(e => selectedEnvironmentIds.includes(e.id))
          .flatMap(e => e.equipmentIds)
      )]
    : equipments.map(eq => eq.id);

  const selectedEnvironmentName = selectedEnvironmentIds.length === 0
    ? "Todos os Ambientes"
    : selectedEnvironmentIds.length === 1
      ? environments.find(e => e.id === selectedEnvironmentIds[0])?.name || "Ambiente"
      : `${selectedEnvironmentIds.length} ambientes`;

  const dateRange = getDateRangeFromPeriod(selectedPeriod, customRange);

  const { data: energyData = [], isLoading: isLoadingEnergy } = useAggregatedEnergyData(dateRange, filteredEquipmentIds);
  const { data: equipmentEfficiency = [], isLoading: isLoadingEfficiency } = useEquipmentEfficiency(dateRange, filteredEquipmentIds);
  const { data: temperatureData = [], isLoading: isLoadingTemperature } = useAggregatedTemperatureData(dateRange, filteredEquipmentIds);
  const { data: usagePatterns = [], isLoading: isLoadingUsage } = useUsagePatterns(dateRange, filteredEquipmentIds);
  const summary = useReportSummary(
    dateRange, 
    filteredEquipmentIds, 
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

  const toggleEnvironment = (envId: string) => {
    setSelectedEnvironmentIds(prev => 
      prev.includes(envId)
        ? prev.filter(id => id !== envId)
        : [...prev, envId]
    );
  };

  const selectAllEnvironments = () => {
    if (selectedEnvironmentIds.length === environments.length) {
      setSelectedEnvironmentIds([]);
    } else {
      setSelectedEnvironmentIds(environments.map(e => e.id));
    }
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

  // Gerar nome do ambiente para export
  const getEnvironmentNameForExport = () => {
    if (selectedEnvironmentIds.length === 0) return "Todos os Ambientes";
    const selectedNames = environments
      .filter(e => selectedEnvironmentIds.includes(e.id))
      .map(e => e.name);
    return selectedNames.join(", ");
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
          <Popover open={environmentPopoverOpen} onOpenChange={setEnvironmentPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[200px] justify-start">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{selectedEnvironmentName}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Selecione os Ambientes</h4>
                <div className="space-y-2">
                  <div 
                    className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-muted cursor-pointer"
                    onClick={selectAllEnvironments}
                  >
                    <Checkbox 
                      checked={selectedEnvironmentIds.length === 0 || selectedEnvironmentIds.length === environments.length}
                      className="pointer-events-none"
                    />
                    <span className="text-sm font-medium">
                      {selectedEnvironmentIds.length === 0 ? "Todos os Ambientes" : "Selecionar Todos"}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    {environments.map((env) => (
                      <div 
                        key={env.id}
                        className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleEnvironment(env.id)}
                      >
                        <Checkbox 
                          checked={selectedEnvironmentIds.includes(env.id)}
                          className="pointer-events-none"
                        />
                        <span className="text-sm">{env.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
            environmentName={getEnvironmentNameForExport()}
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
