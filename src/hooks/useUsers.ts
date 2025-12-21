import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from './useAuth';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role: AppRole;
}

export const useUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserProfile[]> => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]) ?? []);

      return (profiles ?? []).map(profile => ({
        ...profile,
        role: rolesMap.get(profile.id) ?? 'viewer',
      }));
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      fullName, 
      isActive 
    }: { 
      userId: string; 
      fullName?: string; 
      isActive?: boolean;
    }) => {
      const updates: Record<string, unknown> = {};
      if (fullName !== undefined) updates.full_name = fullName;
      if (isActive !== undefined) updates.is_active = isActive;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário atualizado',
        description: 'As informações foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error updating user:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o usuário.',
        variant: 'destructive',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Perfil atualizado',
        description: 'O tipo de perfil foi alterado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Você não tem permissão para alterar perfis de acesso.',
        variant: 'destructive',
      });
    },
  });

  return {
    users,
    isLoading,
    error,
    updateUser: updateUserMutation.mutate,
    updateRole: updateRoleMutation.mutate,
    isUpdating: updateUserMutation.isPending || updateRoleMutation.isPending,
  };
};
