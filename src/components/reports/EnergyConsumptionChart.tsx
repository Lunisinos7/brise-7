import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR, enUS, es, Locale } from "date-fns/locale";
import { Zap, Loader2 } from "lucide-react";
import { AggregatedEnergyData } from "@/hooks/useReportData";
import { useTranslation } from "react-i18next";
const localeMap: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': es
};
interface EnergyConsumptionChartProps {
  data: AggregatedEnergyData[];
  isLoading: boolean;
}
export const EnergyConsumptionChart = ({
  data,
  isLoading
}: EnergyConsumptionChartProps) => {
  const {
    t,
    i18n
  } = useTranslation();
  const currentLocale = localeMap[i18n.language] || ptBR;
  const formattedData = data.map(item => ({
    ...item,
    dateFormatted: format(new Date(item.date), "dd/MM", {
      locale: currentLocale
    })
  }));
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 bg-primary-foreground text-primary" />
          {t('charts.energyConsumption')}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div> : data.length === 0 ? <div className="h-full flex items-center justify-center text-muted-foreground">
            {t('charts.noData')}
          </div> : <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(45, 80%, 55%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(45, 80%, 55%)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dateFormatted" tick={{
            fontSize: 12
          }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
              <YAxis tick={{
            fontSize: 12
          }} tickLine={false} axisLine={false} className="fill-muted-foreground" tickFormatter={value => `${value} kWh`} />
              <Tooltip contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px"
          }} formatter={(value: number) => [`${value.toFixed(2)} kWh`, t('charts.consumption')]} labelFormatter={label => `${t('charts.date')}: ${label}`} />
              <Area type="monotone" dataKey="consumption" stroke="hsl(45, 80%, 55%)" strokeWidth={2} fillOpacity={1} fill="url(#colorConsumption)" />
            </AreaChart>
          </ResponsiveContainer>}
      </CardContent>
    </Card>;
};