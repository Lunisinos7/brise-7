import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Clock, CalendarDays, Plus, ChevronDown, Trash2 } from "lucide-react";
import { useEnvironments } from "@/contexts/EnvironmentContext";
import { useTimeRoutines, type DaySchedule, type TimeSlot } from "@/hooks/useTimeRoutines";

interface TimeRoutineDialogProps {
  children: React.ReactNode;
}

const TimeRoutineDialog = ({ children }: TimeRoutineDialogProps) => {
  const { environments } = useEnvironments();
  const { addRoutine } = useTimeRoutines();
  const [open, setOpen] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

  const daysOfWeek = [
    { id: "monday", label: "Seg", name: "Segunda-feira" },
    { id: "tuesday", label: "Ter", name: "Terça-feira" },
    { id: "wednesday", label: "Qua", name: "Quarta-feira" },
    { id: "thursday", label: "Qui", name: "Quinta-feira" },
    { id: "friday", label: "Sex", name: "Sexta-feira" },
    { id: "saturday", label: "Sáb", name: "Sábado" },
    { id: "sunday", label: "Dom", name: "Domingo" }
  ];

  const resetForm = () => {
    setRoutineName("");
    setDaySchedules([]);
    setSelectedEnvironments([]);
    setOpenAccordions([]);
  };

  const handleCreateRoutine = async () => {
    await addRoutine.mutateAsync({
      name: routineName,
      daySchedules,
      environmentIds: selectedEnvironments,
    });
    resetForm();
    setOpen(false);
  };

  const toggleDaySchedule = (dayId: string) => {
    setDaySchedules(prev => {
      const existingDay = prev.find(day => day.dayId === dayId);
      if (existingDay) {
        setOpenAccordions(prev => prev.filter(id => id !== dayId));
        return prev.filter(day => day.dayId !== dayId);
      } else {
        setOpenAccordions(prev => [...prev, dayId]);
        return [...prev, {
          dayId,
          timeSlots: [{ id: "1", startTime: "09:00", endTime: "17:00" }]
        }];
      }
    });
  };

  const toggleEnvironment = (environmentId: string) => {
    setSelectedEnvironments(prev => 
      prev.includes(environmentId) 
        ? prev.filter(e => e !== environmentId)
        : [...prev, environmentId]
    );
  };

  const addTimeSlot = (dayId: string) => {
    const newTimeSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime: "09:00",
      endTime: "17:00"
    };
    setDaySchedules(prev => prev.map(day => 
      day.dayId === dayId 
        ? { ...day, timeSlots: [...day.timeSlots, newTimeSlot] }
        : day
    ));
  };

  const removeTimeSlot = (dayId: string, slotId: string) => {
    setDaySchedules(prev => prev.map(day => {
      if (day.dayId === dayId && day.timeSlots.length > 1) {
        return {
          ...day,
          timeSlots: day.timeSlots.filter(slot => slot.id !== slotId)
        };
      }
      return day;
    }));
  };

  const updateTimeSlot = (dayId: string, slotId: string, field: 'startTime' | 'endTime', value: string) => {
    setDaySchedules(prev => prev.map(day => 
      day.dayId === dayId
        ? {
            ...day,
            timeSlots: day.timeSlots.map(slot => 
              slot.id === slotId ? { ...slot, [field]: value } : slot
            )
          }
        : day
    ));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cooling" />
            Nova Rotina por Horário
          </DialogTitle>
          <DialogDescription>
            Configure uma automação baseada em horários específicos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome da Rotina */}
          <div className="space-y-2">
            <Label htmlFor="routine-name">Nome da Rotina</Label>
            <Input
              id="routine-name"
              placeholder="Ex: Economia Noturna"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
            />
          </div>

          {/* Configuração por Dia */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Configuração por Dia da Semana
            </Label>
            
            <Accordion type="multiple" className="w-full" value={openAccordions} onValueChange={setOpenAccordions}>
              {daysOfWeek.map((day) => {
                const daySchedule = daySchedules.find(schedule => schedule.dayId === day.id);
                const isSelected = !!daySchedule;
                
                return (
                  <AccordionItem key={day.id} value={day.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer px-3 py-1 ${
                              isSelected 
                                ? "bg-cooling text-white" 
                                : "hover:bg-cooling/10"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDaySchedule(day.id);
                            }}
                          >
                            {day.label}
                          </Badge>
                          <span className="text-sm font-medium">{day.name}</span>
                        </div>
                        {isSelected && (
                          <span className="text-xs text-muted-foreground">
                            {daySchedule.timeSlots.length} horário(s) configurado(s)
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    
                    {isSelected && (
                      <AccordionContent className="pt-4">
                        <div className="space-y-4 pl-4">
                          {/* Horários para este dia */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4" />
                                Horários de Funcionamento
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addTimeSlot(day.id)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar Horário
                              </Button>
                            </div>
                            
                            {daySchedule.timeSlots.map((slot) => (
                              <Card key={slot.id} className="p-3">
                                <div className="flex items-center gap-4">
                                  <div className="grid grid-cols-2 gap-4 flex-1">
                                    <div className="space-y-2">
                                      <Label htmlFor={`start-time-${day.id}-${slot.id}`} className="text-xs">
                                        Horário de Início
                                      </Label>
                                      <Input
                                        id={`start-time-${day.id}-${slot.id}`}
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(e) => updateTimeSlot(day.id, slot.id, 'startTime', e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`end-time-${day.id}-${slot.id}`} className="text-xs">
                                        Horário de Término
                                      </Label>
                                      <Input
                                        id={`end-time-${day.id}-${slot.id}`}
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(e) => updateTimeSlot(day.id, slot.id, 'endTime', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  {daySchedule.timeSlots.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeTimeSlot(day.id, slot.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {/* Seleção de Ambientes */}
          <div className="space-y-3">
            <Label>Ambientes</Label>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedEnvironments.length === 0 
                    ? "Selecionar ambientes" 
                    : `${selectedEnvironments.length} ambiente(s) selecionado(s)`
                  }
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                sideOffset={4}
                className="w-[var(--radix-dropdown-menu-trigger-width)] bg-popover border border-border z-50"
              >
                {environments.map((environment) => (
                  <DropdownMenuCheckboxItem
                    key={environment.id}
                    checked={selectedEnvironments.includes(environment.id)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => toggleEnvironment(environment.id)}
                  >
                    {environment.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>


          {/* Resumo */}
          {routineName && daySchedules.length > 0 && selectedEnvironments.length > 0 && (
            <Card className="bg-cooling/5 border-cooling/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">Resumo da Rotina:</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>{routineName}</strong> será executada nos seguintes dias:
                  </p>
                  {daySchedules.map((daySchedule) => {
                    const day = daysOfWeek.find(d => d.id === daySchedule.dayId);
                    return (
                      <div key={daySchedule.dayId}>
                        <strong>{day?.name}:</strong> 
                        {daySchedule.timeSlots.map((slot, index) => (
                          <span key={slot.id}>
                            {index > 0 && " e "}das <strong>{slot.startTime}</strong> às <strong>{slot.endTime}</strong>
                          </span>
                        ))}
                      </div>
                    );
                  })}
                  <p>
                    Aplicando em <strong>{selectedEnvironments.length} ambiente(s)</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button 
            className="bg-cooling hover:bg-cooling-dark text-white"
            disabled={!routineName || daySchedules.length === 0 || selectedEnvironments.length === 0 || addRoutine.isPending}
            onClick={handleCreateRoutine}
          >
            {addRoutine.isPending ? "Criando..." : "Criar Rotina"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeRoutineDialog;
