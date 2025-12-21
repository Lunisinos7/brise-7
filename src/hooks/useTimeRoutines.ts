import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  dayId: string;
  timeSlots: TimeSlot[];
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
}

export interface CreateTimeRoutineInput {
  name: string;
  daySchedules: DaySchedule[];
  environmentIds: string[];
}

export interface UpdateTimeRoutineInput extends CreateTimeRoutineInput {
  id: string;
}

export const useTimeRoutines = () => {
  const queryClient = useQueryClient();

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ["time-routines"],
    queryFn: async (): Promise<TimeRoutine[]> => {
      // Fetch routines
      const { data: routinesData, error: routinesError } = await supabase
        .from("time_routines")
        .select("*")
        .order("created_at", { ascending: false });

      if (routinesError) throw routinesError;

      // Fetch schedules and environments for each routine
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

          return {
            ...routine,
            schedules: schedules || [],
            environment_ids: (environments || []).map((e) => e.environment_id),
          };
        })
      );

      return routinesWithDetails;
    },
  });

  const addRoutine = useMutation({
    mutationFn: async (input: CreateTimeRoutineInput) => {
      // 1. Create the routine
      const { data: routine, error: routineError } = await supabase
        .from("time_routines")
        .insert({ name: input.name })
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

      return routine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-routines"] });
      toast({
        title: "Rotina criada!",
        description: "A rotina foi salva com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar rotina",
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

      // 2. Delete existing schedules and environments
      await supabase
        .from("time_routine_schedules")
        .delete()
        .eq("routine_id", input.id);

      await supabase
        .from("time_routine_environments")
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

      return input.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-routines"] });
      toast({
        title: "Rotina atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar rotina",
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
      queryClient.invalidateQueries({ queryKey: ["time-routines"] });
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
      queryClient.invalidateQueries({ queryKey: ["time-routines"] });
      toast({
        title: "Rotina excluída",
        description: "A rotina foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir rotina",
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
