import { useState } from 'react';
import { useWorkspaceContext } from '@/contexts/WorkspaceContext';
import { useWorkspaceMembers, WorkspaceMember, WorkspaceRole } from '@/hooks/useWorkspaces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, UserPlus, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import InviteUserDialog from '@/components/workspace/InviteUserDialog';
import InvitationsPanel from '@/components/workspace/InvitationsPanel';
import PendingInvitationsNotification from '@/components/workspace/PendingInvitationsNotification';
import EditMemberDialog from '@/components/workspace/EditMemberDialog';
import { useTranslation } from 'react-i18next';
const Users = () => {
  const {
    t,
    i18n
  } = useTranslation();
  const {
    currentWorkspaceId,
    currentWorkspace,
    canManageWorkspace
  } = useWorkspaceContext();
  const {
    members,
    isLoading
  } = useWorkspaceMembers(currentWorkspaceId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const roleLabels: Record<WorkspaceRole, string> = {
    owner: t('users.roles.owner'),
    admin: t('users.roles.admin'),
    viewer: t('users.roles.viewer')
  };
  const roleBadgeVariants: Record<WorkspaceRole, 'default' | 'secondary' | 'outline'> = {
    owner: 'default',
    admin: 'secondary',
    viewer: 'outline'
  };
  const getDateLocale = () => {
    switch (i18n.language) {
      case 'en-US':
        return enUS;
      case 'es-ES':
        return es;
      default:
        return ptBR;
    }
  };
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return member.profile?.full_name?.toLowerCase().includes(searchLower) || member.profile?.email.toLowerCase().includes(searchLower) || roleLabels[member.role]?.toLowerCase().includes(searchLower);
  });
  const handleEditMember = (member: WorkspaceMember) => {
    setSelectedMember(member);
    setIsEditOpen(true);
  };
  const getStatusBadge = (isActive: boolean) => <Badge variant={isActive ? "default" : "secondary"} className="gap-1">
      <div className={`w-2 h-2 rounded-full ${isActive ? "bg-energy-efficient" : "bg-muted-foreground"}`} />
      {isActive ? t('common.active') : t('common.inactive')}
    </Badge>;
  if (isLoading) {
    return <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      {/* Pending Invitations for current user */}
      <PendingInvitationsNotification />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('users.title')}</h1>
          <p className="text-muted-foreground">
            {t('users.subtitle', {
            count: members.length,
            workspace: currentWorkspace?.name || 'workspace'
          })}
          </p>
        </div>
        {canManageWorkspace && <Button variant="cooling" onClick={() => setIsInviteOpen(true)} className="gap-2 bg-primary">
            <UserPlus className="h-4 w-4" />
            {t('users.invite')}
          </Button>}
      </div>

      {/* Pending Invitations Panel (for admins) */}
      <InvitationsPanel />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('users.searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {/* Members List */}
      <div className="grid gap-4">
        {filteredMembers.length === 0 ? <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? t('users.noResults') : t('users.noMembers')}
            </p>
          </Card> : filteredMembers.map(member => <Card key={member.id} className="hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {member.profile?.full_name?.[0]?.toUpperCase() || member.profile?.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {member.profile?.full_name || t('common.none')}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm">
                        {member.profile?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.profile && getStatusBadge(member.profile.is_active)}
                    <Badge variant={roleBadgeVariants[member.role]}>
                      {roleLabels[member.role]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('users.email')}</p>
                    <p className="font-medium truncate">{member.profile?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('users.access')}</p>
                    <p className="font-medium">{roleLabels[member.role]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('users.memberSince')}</p>
                    <p className="font-medium">
                      {format(new Date(member.created_at), "dd MMM yyyy", {
                  locale: getDateLocale()
                })}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleEditMember(member)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      {t('common.edit')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>)}
      </div>

      {/* Dialogs */}
      <EditMemberDialog member={selectedMember} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <InviteUserDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </div>;
};
export default Users;