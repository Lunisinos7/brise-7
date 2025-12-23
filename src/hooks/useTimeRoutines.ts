import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import i18n from "@/lib/i18n";

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  dayId: string;
  timeSlots: TimeSlot[];
}

export interface RoutineException {
  id: string;
  exception_date: string;
  is_recurring: boolean;
  exception_type: 'closed' | 'custom_hours';
  custom_start_time?: string;
  custom_end_time?: string;
  description?: string;
}

export interface TimeRoutine {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  schedules: {
    day_of_week: string;
    start_time: string;
    end_time: string;
  }[];
  environment_ids: string[];
  exceptions: RoutineException[];
}

export interface CreateTimeRoutineInput {
  name: string;
  daySchedules: DaySchedule[];
  environmentIds: string[];
  workspaceId: string;
  exceptions?: RoutineException[];
}

export interface UpdateTimeRoutineInput extends CreateTimeRoutineInput {
  id: string;
}

export const useTimeRoutines = (workspaceId?: string) => {
  const queryClient = useQueryClient();

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ["time-routines", workspaceId],
    queryFn: async (): Promise<TimeRoutine[]> => {
      if (!workspaceId) return [];
      
      // Fetch routines filtered by workspace
      const { data: routinesData, error: routinesError } = await supabase
        .from("time_routines")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (routinesError) throw routinesError;

      // Fetch schedules, environments and exceptions for each routine
      const routinesWithDetails = await Promise.all(
        (routinesData || []).map(async (routine) => {
          const { data: schedules } = await supabase
            .from("time_routine_schedules")
            .select("day_of_week, start_time, end_time")
            .eq("routine_id", routine.id);

          const { data: environments } = await supabase
            .from("time_routine_environments")
            .select("environment_id")
            .eq("routine_id", routine.id);

          const { data: exceptionsData } = await supabase
            .from("time_routine_exceptions")
            .select("*")
            .eq("routine_id", routine.id);

          const exceptions: RoutineException[] = (exceptionsData || []).map((e) => ({
            id: e.id,
            exception_date: e.exception_date,
            is_recurring: e.is_recurring,
            exception_type: e.exception_type as 'closed' | 'custom_hours',
            custom_start_time: e.custom_start_time || undefined,
            custom_end_time: e.custom_end_time || undefined,
            description: e.description || undefined,
          }));

          return {
            ...routine,
            schedules: schedules || [],
            environment_ids: (environments || []).map((e) => e.environment_id),
            exceptions,
          };
        })
      );

      return routinesWithDetails;
    },
    enabled: !!workspaceId,
  });

  const addRoutine = useMutation({
    mutationFn: async (input: CreateTimeRoutineInput) => {
      // 1. Create the routine with workspace_id
      const { data: routine, error: routineError } = await supabase
        .from("time_routines")
        .insert({ name: input.name, workspace_id: input.workspaceId })
        .select()
        .single();

      if (routineError) throw routineError;

      // 2. Create schedules for each day and time slot
      const scheduleInserts = input.daySchedules.flatMap((day) =>
        day.timeSlots.map((slot) => ({
          routine_id: routine.id,
          day_of_week: day.dayId,
          start_time: slot.startTime,
          end_time: slot.endTime,
        }))
      );

      if (scheduleInserts.length > 0) {
        const { error: schedulesError } = await supabase
          .from("time_routine_schedules")
          .insert(scheduleInserts);

        if (schedulesError) throw schedulesError;
      }

      // 3. Create environment associations
      const environmentInserts = input.environmentIds.map((envId) => ({
        routine_id: routine.id,
        environment_id: envId,
      }));

      if (environmentInserts.length > 0) {
        const { error: envsError } = await supabase
          .from("time_routine_environments")
          .insert(environmentInserts);

        if (envsError) throw envsError;
      }

      // 4. Create exceptions
      if (input.exceptions && input.exceptions.length > 0) {
        const exceptionInserts = input.exceptions.map((exc) => ({
          routine_id: routine.id,
          exception_date: exc.exception_date,
          is_recurring: exc.is_recurring,
          exception_type: exc.exception_type,
          custom_start_time: exc.custom_start_time || null,
          custom_end_time: exc.custom_end_time || null,
          description: exc.description || null,
        }));

        const { error: exceptionsError } = await supabase
          .from("time_routine_exceptions")
          .insert(exceptionInserts);

        if (exceptionsError) throw exceptionsError;
      }

      return routine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-routines", workspaceId] });
      toast({
        title: i18n.t("hooks.timeRoutines.created"),
        description: i18n.t("hooks.timeRoutines.createdDesc"),
      });
    },
    onError: (error) => {
      toast({
        title: i18n.t("hooks.timeRoutines.createError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoutine = useMutation({
    mutationFn: async (input: UpdateTimeRoutineInput) => {
      // 1. Update the routine name
      const { error: routineError } = await supabase
        .from("time_routines")
        .update({ name: input.name })
        .eq("id", input.id);

      if (routineError) throw routineError;

      // 2. Delete existing schedules, environments and exceptions
      await supabase
        .from("time_routine_schedules")
        .delete()
        .eq("routine_id", input.id);

      await supabase
        .from("time_routine_environments")
        .delete()
        .eq("routine_id", input.id);

      await supabase
        .from("time_routine_exceptions")
        .delete()
        .eq("routine_id", input.id);

      // 3. Create new schedules
      const scheduleInserts = input.daySchedules.flatMap((day) =>
        day.timeSlots.map((slot) => ({
          routine_id: input.id,
          day_of_week: day.dayId,
          start_time: slot.startTime,
          end_time: slot.endTime,
        }))
      );

      if (scheduleInserts.length > 0) {
        const { error: schedulesError } = await supabase
          .from("time_routine_schedules")
          .insert(scheduleInserts);

        if (schedulesError) throw schedulesError;
      }

      // 4. Create new environment associations
      const environmentInserts = input.environmentIds.map((envId) => ({
        routine_id: input.id,
        environment_id: envId,
      }));

      if (environmentInserts.length > 0) {
        const { error: envsError } = await supabase
          .from("time_routine_environments")
          .insert(environmentInserts);

        if (envsError) throw envsError;
      }

      // 5. Create new exceptions
      if (input.exceptions && input.exceptions.length > 0) {
        const exceptionInserts = input.exceptions.map((exc) => ({
          routine_id: input.id,
          exception_date: exc.exception_date,
          is_recurring: exc.is_recurring,
          exception_type: exc.exception_type,
          custom_start_time: exc.custom_start_time || null,
          custom_end_time: exc.custom_end_time || null,
          description: exc.description || null,
        }));

        const { error: exceptionsError } = await supabase
          .from("time_routine_exceptions")
          .insert(exceptionInserts);

        if (exceptionsError) throw exceptionsError;
      }

      return input.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-routines", workspaceId] });
      toast({
        title: i18n.t("hooks.timeRoutines.updated"),
        description: i18n.t("hooks.timeRoutines.updatedDesc"),
      });
    },
    onError: (error) => {
      toast({
        title: i18n.t("hooks.timeRoutines.updateError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleRoutine = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("time_routines")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-routines", workspaceId] });
    },
  });

  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("time_routines")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-routines", workspaceId] });
      toast({
        title: i18n.t("hooks.timeRoutines.deleted"),
        description: i18n.t("hooks.timeRoutines.deletedDesc"),
      });
    },
    onError: (error) => {
      toast({
        title: i18n.t("hooks.timeRoutines.deleteError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    routines,
    isLoading,
    addRoutine,
    updateRoutine,
    toggleRoutine,
    deleteRoutine,
  };
};
