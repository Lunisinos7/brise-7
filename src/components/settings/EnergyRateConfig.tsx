import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Save, Loader2 } from "lucide-react";
import { useWorkspaceSettings } from "@/hooks/useWorkspaceSettings";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = [
  { symbol: "R$", code: "BRL", name: "Real Brasileiro" },
  { symbol: "$", code: "USD", name: "Dólar Americano" },
  { symbol: "€", code: "EUR", name: "Euro" },
  { symbol: "£", code: "GBP", name: "Libra Esterlina" },
  { symbol: "¥", code: "JPY", name: "Iene Japonês" },
  { symbol: "$", code: "ARS", name: "Peso Argentino" },
];

export const EnergyRateConfig = () => {
  const { currentWorkspaceId } = useWorkspaceContext();
  const { settings, isLoading, upsertSettings } = useWorkspaceSettings(currentWorkspaceId);
  const { toast } = useToast();

  const [kwhRate, setKwhRate] = useState("0.70");
  const [selectedCurrency, setSelectedCurrency] = useState("BRL");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings && settings.kwh_rate !== undefined) {
      const newRate = String(settings.kwh_rate);
      const newCurrency = settings.currency_code;
      
      if (newRate !== kwhRate) {
        setKwhRate(newRate);
      }
      if (newCurrency !== selectedCurrency) {
        setSelectedCurrency(newCurrency);
      }
    }
  }, [settings?.kwh_rate, settings?.currency_code]);

  const handleSave = async () => {
    const rate = parseFloat(kwhRate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor do kWh deve ser um número maior que zero.",
        variant: "destructive",
      });
      return;
    }

    const currency = CURRENCIES.find(c => c.code === selectedCurrency);
    if (!currency) return;

    setIsSaving(true);
    try {
      await upsertSettings.mutateAsync({
        kwh_rate: rate,
        currency_symbol: currency.symbol,
        currency_code: currency.code,
      });
      toast({
        title: "Configurações salvas",
        description: "As configurações de tarifa foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Configurações de Tarifa de Energia
        </CardTitle>
        <CardDescription>
          Configure o valor do kWh e a moeda para cálculo de custos do workspace atual
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kwh-rate">Valor do kWh</Label>
            <div className="relative">
              <Input
                id="kwh-rate"
                type="number"
                step="0.01"
                min="0.01"
                value={kwhRate}
                onChange={(e) => setKwhRate(e.target.value)}
                placeholder="0.70"
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                /kWh
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Valor cobrado por kWh pela sua concessionária
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moeda</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Selecione a moeda" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{currency.symbol}</span>
                      <span>{currency.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Símbolo exibido nos relatórios e dashboard
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
