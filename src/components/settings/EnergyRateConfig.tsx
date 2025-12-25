import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Save, Loader2 } from "lucide-react";
import { useWorkspaceSettings } from "@/hooks/useWorkspaceSettings";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";

const CURRENCY_CODES = ["BRL", "USD", "EUR", "GBP", "JPY", "ARS"] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
  BRL: "R$",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  ARS: "$",
};

export const EnergyRateConfig = () => {
  const { t } = useTranslation();
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
        title: t("energyRate.invalidValue"),
        description: t("energyRate.invalidValueDesc"),
        variant: "destructive",
      });
      return;
    }

    const symbol = CURRENCY_SYMBOLS[selectedCurrency];
    if (!symbol) return;

    setIsSaving(true);
    try {
      await upsertSettings.mutateAsync({
        kwh_rate: rate,
        currency_symbol: symbol,
        currency_code: selectedCurrency,
      });
      toast({
        title: t("energyRate.savedSuccess"),
        description: t("energyRate.savedSuccessDesc"),
      });
    } catch (error) {
      toast({
        title: t("energyRate.saveError"),
        description: t("energyRate.saveErrorDesc"),
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
          {t("energyRate.title")}
        </CardTitle>
        <CardDescription>
          {t("energyRate.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kwh-rate">{t("energyRate.kwhValue")}</Label>
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
              {t("energyRate.kwhDesc")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t("energyRate.currency")}</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder={t("energyRate.currency")} />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{CURRENCY_SYMBOLS[code]}</span>
                      <span>{t(`currencies.${code}`)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("energyRate.currencyDesc")}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("energyRate.saveConfig")}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};