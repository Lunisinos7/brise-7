import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { CalendarOff, Plus, Trash2, CalendarIcon, RefreshCw, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface RoutineException {
  id: string;
  exception_date: string;
  is_recurring: boolean;
  exception_type: 'closed' | 'custom_hours';
  custom_start_time?: string;
  custom_end_time?: string;
  description?: string;
}

interface ExceptionsSectionProps {
  exceptions: RoutineException[];
  onExceptionsChange: (exceptions: RoutineException[]) => void;
}

const COMMON_HOLIDAYS = [
  { name: "Ano Novo", date: "01-01", recurring: true },
  { name: "Carnaval", date: "02-12", recurring: false }, // Varies each year
  { name: "Sexta-feira Santa", date: "03-29", recurring: false }, // Varies each year
  { name: "Tiradentes", date: "04-21", recurring: true },
  { name: "Dia do Trabalhador", date: "05-01", recurring: true },
  { name: "Corpus Christi", date: "05-30", recurring: false }, // Varies each year
  { name: "Independência", date: "09-07", recurring: true },
  { name: "Nossa Senhora Aparecida", date: "10-12", recurring: true },
  { name: "Finados", date: "11-02", recurring: true },
  { name: "Proclamação da República", date: "11-15", recurring: true },
  { name: "Natal", date: "12-25", recurring: true },
];

const ExceptionsSection = ({ exceptions, onExceptionsChange }: ExceptionsSectionProps) => {
  const addException = () => {
    const newException: RoutineException = {
      id: Date.now().toString(),
      exception_date: format(new Date(), "yyyy-MM-dd"),
      is_recurring: false,
      exception_type: 'closed',
    };
    onExceptionsChange([...exceptions, newException]);
  };

  const addHoliday = (holiday: typeof COMMON_HOLIDAYS[0]) => {
    const currentYear = new Date().getFullYear();
    const [month, day] = holiday.date.split("-");
    const newException: RoutineException = {
      id: Date.now().toString(),
      exception_date: `${currentYear}-${month}-${day}`,
      is_recurring: holiday.recurring,
      exception_type: 'closed',
      description: holiday.name,
    };
    onExceptionsChange([...exceptions, newException]);
  };

  const removeException = (id: string) => {
    onExceptionsChange(exceptions.filter(e => e.id !== id));
  };

  const updateException = (id: string, updates: Partial<RoutineException>) => {
    onExceptionsChange(exceptions.map(e => 
      e.id === id ? { ...e, ...updates } : e
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <CalendarOff className="h-4 w-4" />
          Exceções (Feriados / Dias Fechados)
        </Label>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Feriados
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Feriados Nacionais</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COMMON_HOLIDAYS.map((holiday) => (
                <DropdownMenuItem
                  key={holiday.name}
                  onClick={() => addHoliday(holiday)}
                  className="flex items-center justify-between"
                >
                  <span>{holiday.name}</span>
                  {holiday.recurring && (
                    <RefreshCw className="h-3 w-3 text-muted-foreground" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={addException}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      {exceptions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma exceção configurada. Adicione feriados ou dias específicos.
        </p>
      ) : (
        <div className="space-y-3">
          {exceptions.map((exception) => (
            <Card key={exception.id} className="p-4">
              <div className="space-y-4">
                {/* Row 1: Date, Recurring, Delete */}
                <div className="flex items-center gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[180px] justify-start text-left font-normal",
                          !exception.exception_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {exception.exception_date 
                          ? format(new Date(exception.exception_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })
                          : "Selecionar data"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={exception.exception_date ? new Date(exception.exception_date + 'T12:00:00') : undefined}
                        onSelect={(date) => date && updateException(exception.id, { 
                          exception_date: format(date, "yyyy-MM-dd") 
                        })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={exception.is_recurring}
                      onCheckedChange={(checked) => updateException(exception.id, { is_recurring: checked })}
                    />
                    <Label className="text-sm flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Repetir anualmente
                    </Label>
                  </div>

                  {exception.is_recurring && (
                    <Badge variant="secondary" className="bg-cooling/10 text-cooling">
                      Todo ano
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => removeException(exception.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Row 2: Type and Description */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={exception.exception_type}
                      onValueChange={(value: 'closed' | 'custom_hours') => 
                        updateException(exception.id, { exception_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="closed">Fechado</SelectItem>
                        <SelectItem value="custom_hours">Horário Especial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Descrição (opcional)</Label>
                    <Input
                      placeholder="Ex: Natal, Consulta médica..."
                      value={exception.description || ""}
                      onChange={(e) => updateException(exception.id, { description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Row 3: Custom hours (conditional) */}
                {exception.exception_type === 'custom_hours' && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div className="space-y-2">
                      <Label className="text-xs">Horário de Início</Label>
                      <Input
                        type="time"
                        value={exception.custom_start_time || "09:00"}
                        onChange={(e) => updateException(exception.id, { custom_start_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Horário de Término</Label>
                      <Input
                        type="time"
                        value={exception.custom_end_time || "12:00"}
                        onChange={(e) => updateException(exception.id, { custom_end_time: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {exceptions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {exceptions.filter(e => e.is_recurring).length > 0 && (
            <Badge variant="outline" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              {exceptions.filter(e => e.is_recurring).length} recorrente(s)
            </Badge>
          )}
          {exceptions.filter(e => !e.is_recurring).length > 0 && (
            <Badge variant="outline" className="text-xs">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {exceptions.filter(e => !e.is_recurring).length} pontual(is)
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ExceptionsSection;
