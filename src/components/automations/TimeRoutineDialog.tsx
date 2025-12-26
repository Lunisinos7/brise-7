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
import { useTimeRoutines, type DaySchedule, type TimeSlot, type RoutineException } from "@/hooks/useTimeRoutines";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import ExceptionsSection from "./ExceptionsSection";
import { useTranslation } from "react-i18next";

interface TimeRoutineDialogProps {
  children: React.ReactNode;
}

const TimeRoutineDialog = ({ children }: TimeRoutineDialogProps) => {
  const { t } = useTranslation();
  const { environments } = useEnvironments();
  const { currentWorkspaceId } = useWorkspaceContext();
  const { addRoutine } = useTimeRoutines(currentWorkspaceId || undefined);
  const [open, setOpen] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>([]);
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);
  const [exceptions, setExceptions] = useState<RoutineException[]>([]);

  const daysOfWeek = [
    { id: "monday", label: t('automations.days.monday'), name: t('automations.daysLong.monday') },
    { id: "tuesday", label: t('automations.days.tuesday'), name: t('automations.daysLong.tuesday') },
    { id: "wednesday", label: t('automations.days.wednesday'), name: t('automations.daysLong.wednesday') },
    { id: "thursday", label: t('automations.days.thursday'), name: t('automations.daysLong.thursday') },
    { id: "friday", label: t('automations.days.friday'), name: t('automations.daysLong.friday') },
    { id: "saturday", label: t('automations.days.saturday'), name: t('automations.daysLong.saturday') },
    { id: "sunday", label: t('automations.days.sunday'), name: t('automations.daysLong.sunday') }
  ];

  const resetForm = () => {
    setRoutineName("");
    setDaySchedules([]);
    setSelectedEnvironments([]);
    setOpenAccordions([]);
    setExceptions([]);
  };

  const handleCreateRoutine = async () => {
    if (!currentWorkspaceId) return;
    
    await addRoutine.mutateAsync({
      name: routineName,
      daySchedules,
      environmentIds: selectedEnvironments,
      workspaceId: currentWorkspaceId,
      exceptions,
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
            {t('automations.dialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('automations.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome da Rotina */}
          <div className="space-y-2">
            <Label htmlFor="routine-name">{t('automations.dialog.routineName')}</Label>
            <Input
              id="routine-name"
              placeholder={t('automations.dialog.routineNamePlaceholder')}
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
            />
          </div>

          {/* Configuração por Dia */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {t('automations.dialog.dayConfig')}
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
                            {daySchedule.timeSlots.length} {t('automations.dialog.timeSlotsConfigured')}
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
                                {t('automations.dialog.operatingHours')}
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addTimeSlot(day.id)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                {t('automations.dialog.addTime')}
                              </Button>
                            </div>
                            
                            {daySchedule.timeSlots.map((slot) => (
                              <Card key={slot.id} className="p-3">
                                <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                                  <div className="space-y-2">
                                    <Label htmlFor={`start-time-${day.id}-${slot.id}`} className="text-xs">
                                      {t('automations.dialog.startTime')}
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
                                      {t('automations.dialog.endTime')}
                                    </Label>
                                    <Input
                                      id={`end-time-${day.id}-${slot.id}`}
                                      type="time"
                                      value={slot.endTime}
                                      onChange={(e) => updateTimeSlot(day.id, slot.id, 'endTime', e.target.value)}
                                    />
                                  </div>
                                  {daySchedule.timeSlots.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-10 w-10"
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
            <Label>{t('automations.environments')}</Label>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedEnvironments.length === 0 
                    ? t('automations.dialog.selectEnvironments') 
                    : `${selectedEnvironments.length} ${t('automations.dialog.environmentsSelected')}`
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

          {/* Exceções */}
          <ExceptionsSection 
            exceptions={exceptions} 
            onExceptionsChange={setExceptions} 
          />
          {routineName && daySchedules.length > 0 && selectedEnvironments.length > 0 && (
            <Card className="bg-cooling/5 border-cooling/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">{t('automations.dialog.routineSummary')}</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>{routineName}</strong> {t('automations.dialog.willExecuteOn')}
                  </p>
                  {daySchedules.map((daySchedule) => {
                    const day = daysOfWeek.find(d => d.id === daySchedule.dayId);
                    return (
                      <div key={daySchedule.dayId}>
                        <strong>{day?.name}:</strong> 
                        {daySchedule.timeSlots.map((slot, index) => (
                          <span key={slot.id}>
                            {index > 0 && ` ${t('automations.dialog.and')} `}{t('automations.dialog.from')} <strong>{slot.startTime}</strong> {t('automations.dialog.to')} <strong>{slot.endTime}</strong>
                          </span>
                        ))}
                      </div>
                    );
                  })}
                  <p>
                    {t('automations.dialog.applyingTo')} <strong>{selectedEnvironments.length} {t('automations.dialog.environmentsSelected')}</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          <Button 
            className="bg-cooling hover:bg-cooling-dark text-white"
            disabled={!routineName || daySchedules.length === 0 || selectedEnvironments.length === 0 || addRoutine.isPending}
            onClick={handleCreateRoutine}
          >
            {addRoutine.isPending ? t('common.creating') : t('automations.dialog.createRoutine')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeRoutineDialog;
