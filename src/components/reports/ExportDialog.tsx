import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { PeriodSelector } from "./PeriodSelector";
import { PeriodType, DateRange, getDateRangeFromPeriod } from "@/hooks/useReportData";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  energyData: any[];
  temperatureData: any[];
  equipmentEfficiency: any[];
  summary: {
    totalConsumption: number;
    totalSpent: number;
  };
}

export const ExportDialog = ({
  energyData,
  temperatureData,
  equipmentEfficiency,
  summary,
}: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handlePeriodChange = (period: PeriodType, range?: DateRange) => {
    setSelectedPeriod(period);
    if (range) {
      setCustomRange(range);
    }
  };

  const dateRange = getDateRangeFromPeriod(selectedPeriod, customRange);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPDF({
        energyData,
        temperatureData,
        equipmentEfficiency,
        summary,
        dateRange,
      });
      toast({
        title: "Exportação concluída",
        description: "O relatório PDF foi gerado com sucesso.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o relatório PDF.",
        variant: "destructive",
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
        equipmentEfficiency,
        summary,
        dateRange,
      });
      toast({
        title: "Exportação concluída",
        description: "O relatório Excel foi gerado com sucesso.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o relatório Excel.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="energy" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Relatório</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Selecione o Período</h4>
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              customRange={customRange}
              onPeriodChange={handlePeriodChange}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Formato de Exportação</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <FileText className="h-6 w-6 text-destructive" />
                <span>PDF</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                <FileSpreadsheet className="h-6 w-6 text-energy-efficient" />
                <span>Excel</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
