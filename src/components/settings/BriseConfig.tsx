import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, WifiOff, Eye, EyeOff, RefreshCw, LogOut, Circle } from "lucide-react";
import { useBriseConfig } from "@/hooks/useBriseConfig";
import { useBriseDevices } from "@/hooks/useBriseDevices";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
export function BriseConfig() {
  const {
    t
  } = useTranslation();
  const {
    config,
    isLoading,
    isConfigured,
    login,
    disconnect,
    refetch
  } = useBriseConfig();
  const {
    isLoading: isSyncing,
    discoverDevices
  } = useBriseDevices();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoggingIn(true);
    const success = await login(email, password);
    if (success) {
      setEmail("");
      setPassword("");
    }
    setIsLoggingIn(false);
  };
  const handleDisconnect = async () => {
    await disconnect();
    setShowDisconnectDialog(false);
  };
  const handleSync = async () => {
    await discoverDevices();
    await refetch();
  };
  if (isLoading) {
    return <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>;
  }
  return <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-card">
                <Circle className="h-5 w-5 border-solid border-4 rounded-xl bg-card text-[#0096db]" />
              </div>
              <div>
                <CardTitle className="text-lg">BRISE</CardTitle>
                <CardDescription>
                  {t("brise.description")}
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConfigured ? "default" : "secondary"}>
              {isConfigured ? <>
                  <Wifi className="h-3 w-3 mr-1" />
                  {t("brise.connected")}
                </> : <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  {t("brise.notConfigured")}
                </>}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isConfigured ? <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{t("brise.connectedAs")}</p>
                  <p className="text-sm text-muted-foreground">{config?.user_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{t("brise.lastSync")}</p>
                  <p className="text-xs font-medium">
                    {config?.last_sync_at ? format(new Date(config.last_sync_at), "dd/MM/yyyy HH:mm") : t("brise.neverSynced")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  {t("brise.syncDevices")}
                </Button>
                <Button variant="destructive" onClick={() => setShowDisconnectDialog(true)}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("brise.disconnect")}
                </Button>
              </div>
            </div> : <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brise-email">{t("brise.email")}</Label>
                <Input id="brise-email" type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brise-password">{t("brise.password")}</Label>
                <div className="relative">
                  <Input id="brise-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <Button className="w-full" onClick={handleLogin} disabled={isLoggingIn || !email || !password}>
                {isLoggingIn ? <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("common.loading")}
                  </> : <>
                    <Wifi className="h-4 w-4 mr-2" />
                    {t("brise.login")}
                  </>}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                {t("brise.loginHint")}
              </p>
            </div>}
        </CardContent>
      </Card>

      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("brise.disconnectTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("brise.disconnectDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>
              {t("brise.disconnect")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}