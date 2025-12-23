import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import i18n from '@/lib/i18n';

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
        title: i18n.t('hooks.workspace.created'),
        description: i18n.t('hooks.workspace.createdDesc'),
      });
    },
    onError: (error) => {
      console.error('Error creating workspace:', error);
      toast({
        title: i18n.t('hooks.workspace.createError'),
        description: i18n.t('hooks.workspace.createErrorDesc'),
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
        title: i18n.t('hooks.workspace.updated'),
        description: i18n.t('hooks.workspace.updatedDesc'),
      });
    },
    onError: (error) => {
      console.error('Error updating workspace:', error);
      toast({
        title: i18n.t('hooks.workspace.updateError'),
        description: i18n.t('hooks.workspace.updateErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast({
        title: i18n.t('hooks.workspace.deleted'),
        description: i18n.t('hooks.workspace.deletedDesc'),
      });
    },
    onError: (error) => {
      console.error('Error deleting workspace:', error);
      toast({
        title: i18n.t('hooks.workspace.deleteError'),
        description: i18n.t('hooks.workspace.deleteErrorDesc'),
        variant: 'destructive',
      });
    },
  });

  return {
    workspaces,
    isLoading: isLoadingWorkspaces,
    createWorkspace: createWorkspaceMutation.mutate,
    updateWorkspace: updateWorkspaceMutation.mutate,
    deleteWorkspace: deleteWorkspaceMutation.mutate,
    isCreating: createWorkspaceMutation.isPending,
    isUpdating: updateWorkspaceMutation.isPending,
    isDeleting: deleteWorkspaceMutation.isPending,
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
        title: i18n.t('hooks.workspace.roleUpdated'),
        description: i18n.t('hooks.workspace.roleUpdatedDesc'),
      });
    },
    onError: (error) => {
      console.error('Error updating member role:', error);
      toast({
        title: i18n.t('hooks.workspace.roleUpdateError'),
        description: i18n.t('hooks.workspace.roleUpdateErrorDesc'),
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
        title: i18n.t('hooks.workspace.memberRemoved'),
        description: i18n.t('hooks.workspace.memberRemovedDesc'),
      });
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast({
        title: i18n.t('hooks.workspace.memberRemoveError'),
        description: i18n.t('hooks.workspace.memberRemoveErrorDesc'),
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
        title: i18n.t('hooks.workspace.inviteSent'),
        description: i18n.t('hooks.workspace.inviteSentDesc'),
      });
    },
    onError: (error: any) => {
      console.error('Error creating invitation:', error);
      if (error.code === '23505') {
        toast({
          title: i18n.t('hooks.workspace.inviteExists'),
          description: i18n.t('hooks.workspace.inviteExistsDesc'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: i18n.t('hooks.workspace.inviteError'),
          description: i18n.t('hooks.workspace.inviteErrorDesc'),
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
        title: i18n.t('hooks.workspace.inviteCancelled'),
        description: i18n.t('hooks.workspace.inviteCancelledDesc'),
      });
    },
    onError: (error) => {
      console.error('Error canceling invitation:', error);
      toast({
        title: i18n.t('hooks.workspace.inviteCancelError'),
        description: i18n.t('hooks.workspace.inviteCancelErrorDesc'),
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
      if (!invitation) throw new Error(i18n.t('hooks.workspace.inviteNotFound'));

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
        title: i18n.t('hooks.workspace.inviteAccepted'),
        description: i18n.t('hooks.workspace.inviteAcceptedDesc'),
      });
    },
    onError: (error) => {
      console.error('Error accepting invitation:', error);
      toast({
        title: i18n.t('hooks.workspace.inviteAcceptError'),
        description: i18n.t('hooks.workspace.inviteAcceptErrorDesc'),
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
        title: i18n.t('hooks.workspace.inviteDeclined'),
        description: i18n.t('hooks.workspace.inviteDeclinedDesc'),
      });
    },
    onError: (error) => {
      console.error('Error declining invitation:', error);
      toast({
        title: i18n.t('hooks.workspace.inviteDeclineError'),
        description: i18n.t('hooks.workspace.inviteDeclineErrorDesc'),
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
