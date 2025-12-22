import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type WorkspaceRole = 'owner' | 'admin' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    is_active: boolean;
  };
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export const useWorkspaces = (userId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces', userId],
    queryFn: async (): Promise<Workspace[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!userId) throw new Error('User not authenticated');

      // Use the SECURITY DEFINER function to create workspace and add owner atomically
      const { data: workspaceId, error } = await supabase
        .rpc('create_workspace_with_owner', {
          _name: name,
          _owner_id: userId,
        });

      if (error) throw error;

      // Fetch the created workspace
      const { data: workspace, error: fetchError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (fetchError) throw fetchError;

      return workspace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast({
        title: 'Workspace criado!',
        description: 'O novo workspace foi criado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error creating workspace:', error);
      toast({
        title: 'Erro ao criar workspace',
        description: 'Não foi possível criar o workspace.',
        variant: 'destructive',
      });
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('workspaces')
        .update({ name })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast({
        title: 'Workspace atualizado!',
        description: 'O nome foi alterado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error updating workspace:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o workspace.',
        variant: 'destructive',
      });
    },
  });

  return {
    workspaces,
    isLoading: isLoadingWorkspaces,
    createWorkspace: createWorkspaceMutation.mutate,
    updateWorkspace: updateWorkspaceMutation.mutate,
    isCreating: createWorkspaceMutation.isPending,
  };
};

export const useWorkspaceMembers = (workspaceId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async (): Promise<WorkspaceMember[]> => {
      if (!workspaceId) return [];

      // First fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;

      // Then fetch profiles for all member user_ids
      const userIds = (membersData || []).map(m => m.user_id);
      
      if (userIds.length === 0) return [];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, is_active')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

      return (membersData || []).map(m => ({
        ...m,
        role: m.role as WorkspaceRole,
        profile: profilesMap.get(m.user_id),
      }));
    },
    enabled: !!workspaceId,
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: WorkspaceRole }) => {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast({
        title: 'Perfil atualizado!',
        description: 'O tipo de acesso foi alterado.',
      });
    },
    onError: (error) => {
      console.error('Error updating member role:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível alterar o perfil.',
        variant: 'destructive',
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast({
        title: 'Membro removido',
        description: 'O usuário foi removido do workspace.',
      });
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o membro.',
        variant: 'destructive',
      });
    },
  });

  return {
    members,
    isLoading,
    updateMemberRole: updateMemberRoleMutation.mutate,
    removeMember: removeMemberMutation.mutate,
  };
};

export const useWorkspaceInvitations = (workspaceId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: async (): Promise<WorkspaceInvitation[]> => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(i => ({
        ...i,
        role: i.role as WorkspaceRole,
      }));
    },
    enabled: !!workspaceId,
  });

  const createInvitationMutation = useMutation({
    mutationFn: async ({ 
      email, 
      role, 
      invitedBy 
    }: { 
      email: string; 
      role: WorkspaceRole; 
      invitedBy: string;
    }) => {
      if (!workspaceId) throw new Error('No workspace selected');

      const { data, error } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: workspaceId,
          email,
          role,
          invited_by: invitedBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] });
      toast({
        title: 'Convite enviado!',
        description: 'O usuário receberá um email com o convite.',
      });
    },
    onError: (error: any) => {
      console.error('Error creating invitation:', error);
      if (error.code === '23505') {
        toast({
          title: 'Convite já existe',
          description: 'Este email já foi convidado para este workspace.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao convidar',
          description: 'Não foi possível enviar o convite.',
          variant: 'destructive',
        });
      }
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] });
      toast({
        title: 'Convite cancelado',
        description: 'O convite foi removido.',
      });
    },
    onError: (error) => {
      console.error('Error canceling invitation:', error);
      toast({
        title: 'Erro ao cancelar',
        description: 'Não foi possível cancelar o convite.',
        variant: 'destructive',
      });
    },
  });

  return {
    invitations,
    isLoading,
    createInvitation: createInvitationMutation.mutate,
    cancelInvitation: cancelInvitationMutation.mutate,
    isCreating: createInvitationMutation.isPending,
  };
};

export const usePendingInvitations = (userEmail: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingInvitations = [], isLoading } = useQuery({
    queryKey: ['pending-invitations', userEmail],
    queryFn: async (): Promise<(WorkspaceInvitation & { workspace?: Workspace })[]> => {
      if (!userEmail) return [];

      const { data, error } = await supabase
        .from('workspace_invitations')
        .select(`
          *,
          workspace:workspaces(*)
        `)
        .eq('email', userEmail)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return (data || []).map(i => ({
        ...i,
        role: i.role as WorkspaceRole,
        workspace: i.workspace as Workspace | undefined,
      }));
    },
    enabled: !!userEmail,
  });

  const acceptInvitationMutation = useMutation({
    mutationFn: async ({ invitationId, userId }: { invitationId: string; userId: string }) => {
      // Get the invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError) throw fetchError;
      if (!invitation) throw new Error('Convite não encontrado');

      // Add user to workspace
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: invitation.workspace_id,
          user_id: userId,
          role: invitation.role,
        });

      if (memberError) throw memberError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('workspace_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast({
        title: 'Convite aceito!',
        description: 'Você agora faz parte do workspace.',
      });
    },
    onError: (error) => {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Erro ao aceitar convite',
        description: 'Não foi possível aceitar o convite.',
        variant: 'destructive',
      });
    },
  });

  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast({
        title: 'Convite recusado',
        description: 'O convite foi removido.',
      });
    },
    onError: (error) => {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Erro ao recusar',
        description: 'Não foi possível recusar o convite.',
        variant: 'destructive',
      });
    },
  });

  return {
    pendingInvitations,
    isLoading,
    acceptInvitation: acceptInvitationMutation.mutate,
    declineInvitation: declineInvitationMutation.mutate,
  };
};
