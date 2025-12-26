import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { PeriodSelector } from "./PeriodSelector";
import { PeriodType, DateRange, getDateRangeFromPeriod } from "@/hooks/useReportData";
import { exportToPDF, exportToExcel, ExportTranslations } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { ptBR, enUS, es } from "date-fns/locale";
interface ExportDialogProps {
  energyData: any[];
  temperatureData: any[];
  equipmentExpense: any[];
  summary: {
    totalConsumption: number;
    totalSpent: number;
  };
  environmentName?: string;
  currencySymbol?: string;
}
const getDateLocale = (language: string) => {
  switch (language) {
    case "pt-BR":
      return ptBR;
    case "es-ES":
      return es;
    default:
      return enUS;
  }
};
export const ExportDialog = ({
  energyData,
  temperatureData,
  equipmentExpense,
  summary,
  environmentName,
  currencySymbol = "R$"
}: ExportDialogProps) => {
  const {
    t,
    i18n
  } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const {
    toast
  } = useToast();
  const handlePeriodChange = (period: PeriodType, range?: DateRange) => {
    setSelectedPeriod(period);
    if (range) {
      setCustomRange(range);
    }
  };
  const dateRange = getDateRangeFromPeriod(selectedPeriod, customRange);
  const dateLocale = getDateLocale(i18n.language);
  const getExportTranslations = (): ExportTranslations => ({
    reportTitle: t("export.reportTitle"),
    environment: t("export.environment"),
    allEnvironments: t("export.allEnvironments"),
    period: t("export.period"),
    executiveSummary: t("export.executiveSummary"),
    metric: t("export.metric"),
    value: t("export.value"),
    totalConsumption: t("export.totalConsumption"),
    totalSpending: t("export.totalSpending"),
    expenseByEquipment: t("export.expenseByEquipment"),
    equipment: t("export.equipment"),
    expense: t("export.expense"),
    energyConsumptionByDate: t("export.energyConsumptionByDate"),
    date: t("export.date"),
    consumption: t("export.consumption"),
    pageOf: t("export.pageOf"),
    generatedAt: t("export.generatedAt"),
    sheetSummary: t("export.sheetSummary"),
    sheetEnergyConsumption: t("export.sheetEnergyConsumption"),
    sheetTemperature: t("export.sheetTemperature"),
    sheetExpense: t("export.sheetExpense"),
    currentTemp: t("export.currentTemp"),
    targetTemp: t("export.targetTemp"),
    currencySymbol
  });
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF({
        energyData,
        temperatureData,
        equipmentExpense,
        summary,
        dateRange,
        environmentName,
        translations: getExportTranslations(),
        dateLocale
      });
      toast({
        title: t("export.exportComplete"),
        description: t("export.pdfSuccess")
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: t("export.exportError"),
        description: t("export.pdfError"),
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportToExcel({
        energyData,
        temperatureData,
        equipmentExpense,
        summary,
        dateRange,
        environmentName,
        translations: getExportTranslations(),
        dateLocale
      });
      toast({
        title: t("export.exportComplete"),
        description: t("export.excelSuccess")
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: t("export.exportError"),
        description: t("export.excelError"),
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="energy" className="gap-2 bg-primary">
          <Download className="h-4 w-4" />
          {t("export.export")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("export.exportReport")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h4 className="text-sm font-medium mb-3">{t("reports.selectPeriod")}</h4>
            <PeriodSelector selectedPeriod={selectedPeriod} customRange={customRange} onPeriodChange={handlePeriodChange} />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">{t("export.exportFormat")}</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleExportPDF} disabled={isExporting}>
                <FileText className="h-6 w-6 text-destructive" />
                <span>PDF</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleExportExcel} disabled={isExporting}>
                <FileSpreadsheet className="h-6 w-6 text-energy-efficient" />
                <span>Excel</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};