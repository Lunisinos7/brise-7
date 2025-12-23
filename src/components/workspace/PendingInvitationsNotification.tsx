import { useAuthContext } from "@/contexts/AuthContext";
import { usePendingInvitations } from "@/hooks/useWorkspaces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Check, X, Clock, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS, es, Locale } from "date-fns/locale";
import { useTranslation } from "react-i18next";

const localeMap: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': es,
};

const PendingInvitationsNotification = () => {
  const { t, i18n } = useTranslation();
  const currentLocale = localeMap[i18n.language] || ptBR;
  const { user } = useAuthContext();
  const { pendingInvitations, isLoading, acceptInvitation, declineInvitation } = 
    usePendingInvitations(user?.email);

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    );
  }

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          {t('invitations.pending')}
          <Badge variant="secondary" className="ml-auto">
            {pendingInvitations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingInvitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-background"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-gradient-cooling flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">
                  {invitation.workspace?.name || "Workspace"}
                </p>
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
            <div className="flex items-center gap-2 sm:ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => declineInvitation(invitation.id)}
              >
                <X className="h-4 w-4 mr-1" />
                {t('invitations.decline')}
              </Button>
              <Button
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  if (user?.id) {
                    acceptInvitation({ invitationId: invitation.id, userId: user.id });
                  }
                }}
              >
                <Check className="h-4 w-4 mr-1" />
                {t('invitations.accept')}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PendingInvitationsNotification;
