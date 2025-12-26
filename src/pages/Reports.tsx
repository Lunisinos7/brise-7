import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, Calendar, Zap, Building2 } from "lucide-react";
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
import { useTranslation } from "react-i18next";

const Reports = () => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);
  const [environmentPopoverOpen, setEnvironmentPopoverOpen] = useState(false);
  const [selectedEnvironmentIds, setSelectedEnvironmentIds] = useState<string[]>([]);

  const { currentWorkspaceId } = useWorkspaceContext();
  const { equipments } = useEquipments(currentWorkspaceId);
  const { settings } = useWorkspaceSettings(currentWorkspaceId);
  const { environments } = useEnvironments();

  // Memoize dateRange to prevent infinite loops
  const dateRange = useMemo(() => 
    getDateRangeFromPeriod(selectedPeriod, customRange),
    [selectedPeriod, customRange]
  );

  // Memoize filteredEquipmentIds to prevent infinite loops
  const filteredEquipmentIds = useMemo(() => {
    if (selectedEnvironmentIds.length > 0) {
      return [...new Set(
        environments
          .filter(e => selectedEnvironmentIds.includes(e.id))
          .flatMap(e => e.equipmentIds)
      )];
    }
    return equipments.map(eq => eq.id);
  }, [selectedEnvironmentIds, environments, equipments]);

  const selectedEnvironmentName = selectedEnvironmentIds.length === 0
    ? t('reports.allEnvironments')
    : selectedEnvironmentIds.length === 1
      ? environments.find(e => e.id === selectedEnvironmentIds[0])?.name || t('dashboard.environments')
      : `${selectedEnvironmentIds.length} ${t('reports.environments')}`;

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
    "24h": t('reports.periods.24h'),
    week: t('reports.periods.week'),
    month: t('reports.periods.month'),
    quarter: t('reports.periods.quarter'),
    semester: t('reports.periods.semester'),
    year: t('reports.periods.year'),
    custom: t('reports.periods.custom'),
  };

  // Gerar nome do ambiente para export
  const getEnvironmentNameForExport = () => {
    if (selectedEnvironmentIds.length === 0) return t('reports.allEnvironments');
    const selectedNames = environments
      .filter(e => selectedEnvironmentIds.includes(e.id))
      .map(e => e.name);
    return selectedNames.join(", ");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
          <p className="text-muted-foreground">
            {t('reports.subtitle')}
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
                <h4 className="font-medium text-sm">{t('reports.selectEnvironments')}</h4>
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
                      {selectedEnvironmentIds.length === 0 ? t('reports.allEnvironments') : t('reports.selectAll')}
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
                <h4 className="font-medium text-sm">{t('reports.selectPeriod')}</h4>
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
            currencySymbol={settings?.currency_symbol || "R$"}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('reports.totalConsumption')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalConsumption.toFixed(2)} kWh</div>
            <p className="text-sm text-muted-foreground">{t('reports.selectedPeriod')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('reports.spending')} ({summary.currencySymbol})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.currencySymbol} {summary.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-muted-foreground">{t('reports.selectedPeriod')}</p>
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
