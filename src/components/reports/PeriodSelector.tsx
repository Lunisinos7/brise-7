import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PeriodType, DateRange } from "@/hooks/useReportData";
import { useState } from "react";
import { DateRange as DayPickerDateRange } from "react-day-picker";

interface PeriodSelectorProps {
  selectedPeriod: PeriodType;
  customRange?: DateRange;
  onPeriodChange: (period: PeriodType, customRange?: DateRange) => void;
}

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: "24h", label: "Últimas 24h" },
  { value: "week", label: "Última Semana" },
  { value: "month", label: "Último Mês" },
  { value: "quarter", label: "Último Trimestre" },
  { value: "semester", label: "Último Semestre" },
  { value: "year", label: "Último Ano" },
];

export const PeriodSelector = ({
  selectedPeriod,
  customRange,
  onPeriodChange,
}: PeriodSelectorProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DayPickerDateRange | undefined>(
    customRange ? { from: customRange.from, to: customRange.to } : undefined
  );

  const handleDateRangeSelect = (range: DayPickerDateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onPeriodChange("custom", { from: range.from, to: range.to });
      setCalendarOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {periodOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedPeriod === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onPeriodChange(option.value)}
            className="w-full"
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedPeriod === "custom" ? "default" : "outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              selectedPeriod !== "custom" && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedPeriod === "custom" && customRange ? (
              <>
                {format(customRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(customRange.to, "dd/MM/yyyy", { locale: ptBR })}
              </>
            ) : (
              "Período Customizado"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            locale={ptBR}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
