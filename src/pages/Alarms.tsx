import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  Clock,
  Filter,
  Settings,
  Thermometer,
  Trash2,
  Zap,
} from "lucide-react";
import { mockAlerts } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const Alarms = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<string>("all");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [tempAlertMin, setTempAlertMin] = useState(16);
  const [tempAlertMax, setTempAlertMax] = useState(28);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.type === filter;
  });

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    toast({
      title: "Alerta Dispensado",
      description: "O alerta foi removido da lista.",
    });
  };

  const handleClearAll = () => {
    setAlerts([]);
    toast({
      title: "Alertas Limpos",
      description: "Todos os alertas foram removidos.",
    });
  };

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

  return (
    <div className="p-6 space-y-6 bg-gradient-dashboard min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alarmes</h1>
          <p className="text-muted-foreground">
            Gerencie alertas e notificações do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={notificationsEnabled ? "default" : "secondary"}>
            {notificationsEnabled ? (
              <Bell className="h-3 w-3 mr-1" />
            ) : (
              <BellOff className="h-3 w-3 mr-1" />
            )}
            {notificationsEnabled ? "Notificações Ativas" : "Notificações Pausadas"}
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
                  Alertas Ativos ({filteredAlerts.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filter === "critical" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setFilter("critical")}
                  >
                    Críticos
                  </Button>
                  <Button
                    variant={filter === "warning" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setFilter("warning")}
                  >
                    Avisos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Nenhum alerta ativo</p>
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
                                ? "CRÍTICO"
                                : alert.type === "warning"
                                ? "AVISO"
                                : "INFO"}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1">{alert.message}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDismissAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleClearAll}
                  >
                    Limpar Todos os Alertas
                  </Button>
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
                Configurações de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-sm">
                  Notificações Push
                </Label>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="text-sm">
                  Alertas por Email
                </Label>
                <Switch
                  id="email"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Temperature Alert Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Thermometer className="h-4 w-4" />
                Limites de Temperatura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Temperatura Mínima (°C)</Label>
                <Input
                  type="number"
                  value={tempAlertMin}
                  onChange={(e) => setTempAlertMin(Number(e.target.value))}
                  min={10}
                  max={25}
                />
                <p className="text-xs text-muted-foreground">
                  Alerta se temperatura cair abaixo deste valor
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Temperatura Máxima (°C)</Label>
                <Input
                  type="number"
                  value={tempAlertMax}
                  onChange={(e) => setTempAlertMax(Number(e.target.value))}
                  min={20}
                  max={35}
                />
                <p className="text-xs text-muted-foreground">
                  Alerta se temperatura subir acima deste valor
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alert Types Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4" />
                Tipos de Alerta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="destructive" className="mt-0.5">CRÍTICO</Badge>
                <p className="text-xs text-muted-foreground">
                  Falhas de equipamento, temperaturas extremas
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">AVISO</Badge>
                <p className="text-xs text-muted-foreground">
                  Manutenção necessária, consumo elevado
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">INFO</Badge>
                <p className="text-xs text-muted-foreground">
                  Atualizações de status, lembretes
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