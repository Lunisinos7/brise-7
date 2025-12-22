import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  Clock,
  Settings,
  Thermometer,
  Trash2,
  Zap,
  Loader2,
} from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useAlertSettings } from "@/hooks/useAlertSettings";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useTranslation } from "react-i18next";

const Alarms = () => {
  const { t } = useTranslation();
  const { alerts, isLoading: alertsLoading, dismissAlert, clearAllAlerts } = useAlerts();
  const { settings, isLoading: settingsLoading, isSaving, updateSettings } = useAlertSettings();
  const { canManageWorkspace } = useWorkspaceContext();
  const [filter, setFilter] = useState<string>("all");

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.type === filter;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSettingsChange = (key: string, value: boolean | number) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('alarms.title')}</h1>
          <p className="text-muted-foreground">
            {t('alarms.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={settings.notifications_enabled ? "default" : "secondary"}>
            {settings.notifications_enabled ? (
              <Bell className="h-3 w-3 mr-1" />
            ) : (
              <BellOff className="h-3 w-3 mr-1" />
            )}
            {settings.notifications_enabled ? t('alarms.notificationsActive') : t('alarms.notificationsPaused')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t('alarms.activeAlerts')} ({filteredAlerts.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                  >
                    {t('alarms.all')}
                  </Button>
                  <Button
                    variant={filter === "critical" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setFilter("critical")}
                  >
                    {t('alarms.criticals')}
                  </Button>
                  <Button
                    variant={filter === "warning" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setFilter("warning")}
                  >
                    {t('alarms.warnings')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>{t('alarms.noAlerts')}</p>
                </div>
              ) : (
                <>
                  {filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start justify-between p-4 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                alert.type === "critical"
                                  ? "destructive"
                                  : alert.type === "warning"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {alert.type === "critical"
                                ? t('alarms.critical').toUpperCase()
                                : alert.type === "warning"
                                ? t('alarms.warning').toUpperCase()
                                : t('common.info').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {canManageWorkspace && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {canManageWorkspace && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={clearAllAlerts}
                    >
                      {t('alarms.clearAll')}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-4">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                {t('alarms.notificationSettings')}
                {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settingsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications" className="text-sm">
                      {t('alarms.pushNotifications')}
                    </Label>
                    <Switch
                      id="notifications"
                      checked={settings.notifications_enabled}
                      onCheckedChange={(checked) =>
                        handleSettingsChange("notifications_enabled", checked)
                      }
                      disabled={!canManageWorkspace || isSaving}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-sm">
                      {t('alarms.emailAlerts')}
                    </Label>
                    <Switch
                      id="email"
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) =>
                        handleSettingsChange("email_notifications", checked)
                      }
                      disabled={!canManageWorkspace || isSaving}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Temperature Alert Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Thermometer className="h-4 w-4" />
                {t('alarms.temperatureLimits')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settingsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">{t('alarms.minTemp')}</Label>
                    <Input
                      type="number"
                      value={settings.temp_alert_min}
                      onChange={(e) =>
                        handleSettingsChange("temp_alert_min", Number(e.target.value))
                      }
                      min={10}
                      max={25}
                      disabled={!canManageWorkspace || isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('alarms.minTempDesc')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t('alarms.maxTemp')}</Label>
                    <Input
                      type="number"
                      value={settings.temp_alert_max}
                      onChange={(e) =>
                        handleSettingsChange("temp_alert_max", Number(e.target.value))
                      }
                      min={20}
                      max={35}
                      disabled={!canManageWorkspace || isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('alarms.maxTempDesc')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Alert Types Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4" />
                {t('alarms.alertTypes')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="destructive" className="mt-0.5">{t('alarms.critical').toUpperCase()}</Badge>
                <p className="text-xs text-muted-foreground">
                  {t('alarms.criticalDesc')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">{t('alarms.warning').toUpperCase()}</Badge>
                <p className="text-xs text-muted-foreground">
                  {t('alarms.warningDesc')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">{t('common.info').toUpperCase()}</Badge>
                <p className="text-xs text-muted-foreground">
                  {t('alarms.infoDesc')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Alarms;
