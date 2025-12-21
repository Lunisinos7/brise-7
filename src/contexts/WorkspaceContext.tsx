import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthContext } from './AuthContext';
import { useWorkspaces, useWorkspaceMembers, Workspace, WorkspaceMember, WorkspaceRole } from '@/hooks/useWorkspaces';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
  members: WorkspaceMember[];
  isLoading: boolean;
  isLoadingMembers: boolean;
  currentUserRole: WorkspaceRole | null;
  isWorkspaceOwner: boolean;
  isWorkspaceAdmin: boolean;
  canManageWorkspace: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const CURRENT_WORKSPACE_KEY = 'brise-current-workspace';

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext();
  const { workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces(user?.id);
  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState<string | null>(() => {
    // Try to get from localStorage on init
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CURRENT_WORKSPACE_KEY);
    }
    return null;
  });

  const { members, isLoading: isLoadingMembers } = useWorkspaceMembers(currentWorkspaceId);

  // Persist workspace selection
  const setCurrentWorkspaceId = (id: string | null) => {
    setCurrentWorkspaceIdState(id);
    if (id) {
      localStorage.setItem(CURRENT_WORKSPACE_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_WORKSPACE_KEY);
    }
  };

  // Auto-select workspace when workspaces load
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspaceId) {
      // No workspace selected, select the first one
      setCurrentWorkspaceId(workspaces[0].id);
    } else if (workspaces.length > 0 && currentWorkspaceId) {
      // Verify the selected workspace still exists
      const exists = workspaces.some(w => w.id === currentWorkspaceId);
      if (!exists) {
        setCurrentWorkspaceId(workspaces[0].id);
      }
    }
  }, [workspaces, currentWorkspaceId]);

  // Clear workspace when user logs out
  useEffect(() => {
    if (!user) {
      setCurrentWorkspaceId(null);
    }
  }, [user]);

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || null;

  const currentUserMember = members.find(m => m.user_id === user?.id);
  const currentUserRole = currentUserMember?.role || null;
  const isWorkspaceOwner = currentUserRole === 'owner';
  const isWorkspaceAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canManageWorkspace = isWorkspaceAdmin;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        currentWorkspaceId,
        setCurrentWorkspaceId,
        members,
        isLoading: isLoadingWorkspaces,
        isLoadingMembers,
        currentUserRole,
        isWorkspaceOwner,
        isWorkspaceAdmin,
        canManageWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaceContext = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
  }
  return context;
};
