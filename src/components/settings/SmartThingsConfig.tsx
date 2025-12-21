import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  WifiOff, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Loader2,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { useSmartThingsConfig } from "@/hooks/useSmartThingsConfig";
import { useSmartThingsDevices } from "@/hooks/useSmartThingsDevices";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SmartThingsConfig() {
  const { config, isLoading, isConfigured, saveConfig, disconnectSmartThings } = useSmartThingsConfig();
  const { syncAllDevices, isLoading: isSyncing } = useSmartThingsDevices();
  
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const handleTestConnection = async () => {
    if (!token) return;
    
    setIsTesting(true);
    setTestResult(null);

    const { validateToken } = useSmartThingsConfig();
    const result = await validateToken(token);
    
    setTestResult(result.valid ? "success" : "error");
    setIsTesting(false);
  };

  const handleSave = async () => {
    if (!token) return;
    
    setIsSaving(true);
    const success = await saveConfig(token);
    
    if (success) {
      setToken("");
      setTestResult(null);
    }
    
    setIsSaving(false);
  };

  const handleDisconnect = async () => {
    await disconnectSmartThings();
    setShowDisconnectDialog(false);
  };

  const handleSync = async () => {
    await syncAllDevices();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConfigured ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <CardTitle className="text-lg">Samsung SmartThings</CardTitle>
                <CardDescription>
                  Conecte seus ar-condicionados Samsung via SmartThings
                </CardDescription>
              </div>
            </div>
            <Badge variant={isConfigured ? "default" : "secondary"}>
              {isConfigured ? "Conectado" : "Não Configurado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConfigured ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status da Conexão</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Token ativo</span>
                    {config?.last_sync_at && (
                      <span className="text-xs">
                        • Última sync: {new Date(config.last_sync_at).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Sincronizar</span>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setShowDisconnectDialog(true)}
                  >
                    Desconectar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pat">Personal Access Token (PAT)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="pat"
                      type={showToken ? "text" : "password"}
                      placeholder="Cole seu token aqui..."
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value);
                        setTestResult(null);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={!token || isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Testar"
                    )}
                  </Button>
                </div>
                {testResult === "success" && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Token válido! Você pode salvar a configuração.
                  </p>
                )}
                {testResult === "error" && (
                  <p className="text-sm text-destructive">
                    Token inválido ou expirado. Verifique e tente novamente.
                  </p>
                )}
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Como obter o Personal Access Token:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Acesse o painel de desenvolvedores SmartThings</li>
                  <li>Clique em "Generate new token"</li>
                  <li>Selecione as permissões de dispositivos (r:devices:*, x:devices:*)</li>
                  <li>Copie e cole o token acima</li>
                </ol>
                <a
                  href="https://account.smartthings.com/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                >
                  Abrir painel SmartThings
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={!token || isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Configuração"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar SmartThings?</AlertDialogTitle>
            <AlertDialogDescription>
              Os equipamentos SmartThings permanecerão no sistema, mas não serão mais sincronizados automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
