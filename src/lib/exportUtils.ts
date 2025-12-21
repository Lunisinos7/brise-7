import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "@/hooks/useReportData";

interface ExportData {
  energyData: any[];
  temperatureData: any[];
  equipmentEfficiency: any[];
  summary: {
    energySavings: number;
    avgEfficiency: number;
    totalConsumption: number;
    co2Reduction: number;
    moneySaved: number;
  };
  dateRange: DateRange;
}

export const exportToPDF = async (data: ExportData): Promise<void> => {
  const { energyData, temperatureData, equipmentEfficiency, summary, dateRange } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Relatório de Climatização", pageWidth / 2, 20, { align: "center" });
  
  // Date range
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const periodText = `Período: ${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`;
  doc.text(periodText, pageWidth / 2, 28, { align: "center" });
  
  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Resumo Executivo", 14, 42);
  
  const summaryData = [
    ["Economia de Energia", `${summary.energySavings.toFixed(1)}%`],
    ["Eficiência Média", `${summary.avgEfficiency.toFixed(1)}%`],
    ["Consumo Total", `${summary.totalConsumption.toFixed(2)} kWh`],
    ["Redução de CO₂", `${summary.co2Reduction.toFixed(2)} toneladas`],
    ["Economia Financeira", `R$ ${summary.moneySaved.toFixed(2)}`],
  ];
  
  autoTable(doc, {
    startY: 46,
    head: [["Métrica", "Valor"]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [0, 150, 136] },
    margin: { left: 14, right: 14 },
  });
  
  // Equipment efficiency section
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.text("Eficiência por Equipamento", 14, currentY);
  
  if (equipmentEfficiency.length > 0) {
    const efficiencyTableData = equipmentEfficiency.map((eq) => [
      eq.equipment_name,
      `${eq.avg_efficiency.toFixed(1)}%`,
      `${eq.total_consumption.toFixed(2)} kWh`,
    ]);
    
    autoTable(doc, {
      startY: currentY + 4,
      head: [["Equipamento", "Eficiência Média", "Consumo Total"]],
      body: efficiencyTableData,
      theme: "striped",
      headStyles: { fillColor: [0, 150, 136] },
      margin: { left: 14, right: 14 },
    });
  }
  
  // Energy consumption by date
  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(14);
  doc.text("Consumo Energético por Data", 14, currentY);
  
  if (energyData.length > 0) {
    const energyTableData = energyData.slice(0, 15).map((item) => [
      format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR }),
      `${item.consumption.toFixed(2)} kWh`,
      `${item.efficiency.toFixed(1)}%`,
    ]);
    
    autoTable(doc, {
      startY: currentY + 4,
      head: [["Data", "Consumo", "Eficiência"]],
      body: energyTableData,
      theme: "striped",
      headStyles: { fillColor: [0, 150, 136] },
      margin: { left: 14, right: 14 },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} | Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  doc.save(`relatorio-climatizacao-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

export const exportToExcel = async (data: ExportData): Promise<void> => {
  const { energyData, temperatureData, equipmentEfficiency, summary, dateRange } = data;
  
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summarySheetData = [
    ["Relatório de Climatização"],
    [`Período: ${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`],
    [],
    ["Resumo Executivo"],
    ["Métrica", "Valor"],
    ["Economia de Energia", `${summary.energySavings.toFixed(1)}%`],
    ["Eficiência Média", `${summary.avgEfficiency.toFixed(1)}%`],
    ["Consumo Total", `${summary.totalConsumption.toFixed(2)} kWh`],
    ["Redução de CO₂", `${summary.co2Reduction.toFixed(2)} toneladas`],
    ["Economia Financeira", `R$ ${summary.moneySaved.toFixed(2)}`],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");
  
  // Energy consumption sheet
  const energySheetData = [
    ["Data", "Consumo (kWh)", "Eficiência (%)"],
    ...energyData.map((item) => [
      format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR }),
      item.consumption.toFixed(2),
      item.efficiency.toFixed(1),
    ]),
  ];
  
  const energySheet = XLSX.utils.aoa_to_sheet(energySheetData);
  XLSX.utils.book_append_sheet(workbook, energySheet, "Consumo Energético");
  
  // Temperature sheet
  const temperatureSheetData = [
    ["Data", "Temperatura Atual (°C)", "Temperatura Alvo (°C)"],
    ...temperatureData.map((item) => [
      format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR }),
      item.current_temp.toFixed(1),
      item.target_temp.toFixed(1),
    ]),
  ];
  
  const temperatureSheet = XLSX.utils.aoa_to_sheet(temperatureSheetData);
  XLSX.utils.book_append_sheet(workbook, temperatureSheet, "Temperatura");
  
  // Equipment efficiency sheet
  const efficiencySheetData = [
    ["Equipamento", "Eficiência Média (%)", "Consumo Total (kWh)"],
    ...equipmentEfficiency.map((eq) => [
      eq.equipment_name,
      eq.avg_efficiency.toFixed(1),
      eq.total_consumption.toFixed(2),
    ]),
  ];
  
  const efficiencySheet = XLSX.utils.aoa_to_sheet(efficiencySheetData);
  XLSX.utils.book_append_sheet(workbook, efficiencySheet, "Eficiência");
  
  XLSX.writeFile(workbook, `relatorio-climatizacao-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};
