import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format, Locale } from "date-fns";
import { DateRange } from "@/hooks/useReportData";

export interface ExportTranslations {
  reportTitle: string;
  environment: string;
  allEnvironments: string;
  period: string;
  executiveSummary: string;
  metric: string;
  value: string;
  totalConsumption: string;
  totalSpending: string;
  expenseByEquipment: string;
  equipment: string;
  expense: string;
  energyConsumptionByDate: string;
  date: string;
  consumption: string;
  pageOf: string;
  generatedAt: string;
  sheetSummary: string;
  sheetEnergyConsumption: string;
  sheetTemperature: string;
  sheetExpense: string;
  currentTemp: string;
  targetTemp: string;
  currencySymbol: string;
}

interface ExportData {
  energyData: any[];
  temperatureData: any[];
  equipmentExpense: any[];
  summary: {
    totalConsumption: number;
    totalSpent: number;
  };
  dateRange: DateRange;
  environmentName?: string;
  translations: ExportTranslations;
  dateLocale?: Locale;
}

export const exportToPDF = async (data: ExportData): Promise<void> => {
  const { 
    energyData, 
    temperatureData, 
    equipmentExpense, 
    summary, 
    dateRange, 
    environmentName,
    translations: t,
    dateLocale
  } = data;
  
  const displayEnvironmentName = environmentName || t.allEnvironments;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const bottomMargin = 25;
  
  // Helper function to check if we need a new page
  const checkPageBreak = (currentY: number, neededSpace: number): number => {
    if (currentY + neededSpace > pageHeight - bottomMargin) {
      doc.addPage();
      return 20;
    }
    return currentY;
  };

  const formatDate = (date: Date, formatStr: string) => {
    return dateLocale 
      ? format(date, formatStr, { locale: dateLocale })
      : format(date, formatStr);
  };
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(t.reportTitle, pageWidth / 2, 20, { align: "center" });
  
  // Environment name
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(`${t.environment}: ${displayEnvironmentName}`, pageWidth / 2, 28, { align: "center" });
  
  // Date range
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const periodText = `${t.period}: ${formatDate(dateRange.from, "dd/MM/yyyy")} - ${formatDate(dateRange.to, "dd/MM/yyyy")}`;
  doc.text(periodText, pageWidth / 2, 35, { align: "center" });
  
  // Summary section
  let currentY = 48;
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(t.executiveSummary, margin, currentY);
  
  const summaryData = [
    [t.totalConsumption, `${summary.totalConsumption.toFixed(2)} kWh`],
    [t.totalSpending, `${t.currencySymbol} ${summary.totalSpent.toFixed(2)}`],
  ];
  
  autoTable(doc, {
    startY: currentY + 6,
    head: [[t.metric, t.value]],
    body: summaryData,
    theme: "striped",
    headStyles: { fillColor: [0, 150, 136] },
    margin: { left: margin, right: margin },
    styles: { cellPadding: 4 },
  });
  
  // Equipment expense section
  currentY = (doc as any).lastAutoTable.finalY + 20;
  currentY = checkPageBreak(currentY, 60);
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(t.expenseByEquipment, margin, currentY);
  
  if (equipmentExpense.length > 0) {
    const expenseTableData = equipmentExpense.map((eq: any) => [
      eq.equipment_name,
      `${eq.total_kwh.toFixed(2)} kWh`,
      `${t.currencySymbol} ${eq.total_expense.toFixed(2)}`,
    ]);
    
    autoTable(doc, {
      startY: currentY + 8,
      head: [[t.equipment, t.totalConsumption, t.expense]],
      body: expenseTableData,
      theme: "striped",
      headStyles: { fillColor: [0, 150, 136] },
      margin: { left: margin, right: margin },
      styles: { cellPadding: 4 },
      didDrawPage: (data) => {
        // Reset currentY on new pages created by autoTable
      },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 20;
  } else {
    currentY += 20;
  }
  
  // Energy consumption by date
  currentY = checkPageBreak(currentY, 60);
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(t.energyConsumptionByDate, margin, currentY);
  
  if (energyData.length > 0) {
    const energyTableData = energyData.slice(0, 20).map((item: any) => [
      formatDate(new Date(item.date), "dd/MM/yyyy"),
      `${item.consumption.toFixed(2)} kWh`,
    ]);
    
    autoTable(doc, {
      startY: currentY + 8,
      head: [[t.date, t.consumption]],
      body: energyTableData,
      theme: "striped",
      headStyles: { fillColor: [0, 150, 136] },
      margin: { left: margin, right: margin },
      styles: { cellPadding: 4 },
    });
  }
  
  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    
    const pageText = t.pageOf
      .replace("{{current}}", String(i))
      .replace("{{total}}", String(pageCount));
    
    doc.text(
      `${pageText} | ${t.generatedAt} ${formatDate(new Date(), "dd/MM/yyyy HH:mm")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }
  
  doc.save(`report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

export const exportToExcel = async (data: ExportData): Promise<void> => {
  const { 
    energyData, 
    temperatureData, 
    equipmentExpense, 
    summary, 
    dateRange, 
    environmentName,
    translations: t,
    dateLocale
  } = data;
  
  const displayEnvironmentName = environmentName || t.allEnvironments;

  const formatDate = (date: Date, formatStr: string) => {
    return dateLocale 
      ? format(date, formatStr, { locale: dateLocale })
      : format(date, formatStr);
  };
  
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summarySheetData = [
    [t.reportTitle],
    [`${t.environment}: ${displayEnvironmentName}`],
    [`${t.period}: ${formatDate(dateRange.from, "dd/MM/yyyy")} - ${formatDate(dateRange.to, "dd/MM/yyyy")}`],
    [],
    [t.executiveSummary],
    [t.metric, t.value],
    [t.totalConsumption, `${summary.totalConsumption.toFixed(2)} kWh`],
    [t.totalSpending, `${t.currencySymbol} ${summary.totalSpent.toFixed(2)}`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, t.sheetSummary);
  
  // Energy consumption sheet
  const energySheetData = [
    [t.date, `${t.consumption} (kWh)`],
    ...energyData.map((item: any) => [
      formatDate(new Date(item.date), "dd/MM/yyyy"),
      item.consumption.toFixed(2),
    ]),
  ];
  
  const energySheet = XLSX.utils.aoa_to_sheet(energySheetData);
  XLSX.utils.book_append_sheet(workbook, energySheet, t.sheetEnergyConsumption);
  
  // Temperature sheet
  const temperatureSheetData = [
    [t.date, t.currentTemp, t.targetTemp],
    ...temperatureData.map((item: any) => [
      formatDate(new Date(item.date), "dd/MM/yyyy"),
      item.current_temp.toFixed(1),
      item.target_temp.toFixed(1),
    ]),
  ];
  
  const temperatureSheet = XLSX.utils.aoa_to_sheet(temperatureSheetData);
  XLSX.utils.book_append_sheet(workbook, temperatureSheet, t.sheetTemperature);
  
  // Equipment expense sheet
  const expenseSheetData = [
    [t.equipment, `${t.consumption} (kWh)`, `${t.expense} (${t.currencySymbol})`],
    ...equipmentExpense.map((eq: any) => [
      eq.equipment_name,
      eq.total_kwh.toFixed(2),
      eq.total_expense.toFixed(2),
    ]),
  ];
  
  const expenseSheet = XLSX.utils.aoa_to_sheet(expenseSheetData);
  XLSX.utils.book_append_sheet(workbook, expenseSheet, t.sheetExpense);
  
  XLSX.writeFile(workbook, `report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};