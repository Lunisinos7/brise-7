import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useWorkspaceInvitations, WorkspaceRole } from "@/hooks/useWorkspaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Clock, X, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS, es, Locale } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const localeMap: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': es,
};

const roleBadgeVariants: Record<WorkspaceRole, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  viewer: "outline",
};

const InvitationsPanel = () => {
  const { t, i18n } = useTranslation();
  const currentLocale = localeMap[i18n.language] || ptBR;
  const { currentWorkspaceId, canManageWorkspace } = useWorkspaceContext();
  const { invitations, isLoading, cancelInvitation } = useWorkspaceInvitations(currentWorkspaceId);

  const roleLabels: Record<WorkspaceRole, string> = {
    owner: t('workspace.roles.owner'),
    admin: t('workspace.roles.admin'),
    viewer: t('workspace.roles.viewer'),
  };

  if (!canManageWorkspace) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-4 w-4" />
          {t('workspace.pendingInvitations')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{invitation.email}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {t('invitations.expires')} {formatDistanceToNow(new Date(invitation.expires_at), {
                      addSuffix: true,
                      locale: currentLocale,
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={roleBadgeVariants[invitation.role]}>
                {roleLabels[invitation.role]}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => cancelInvitation(invitation.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default InvitationsPanel;
