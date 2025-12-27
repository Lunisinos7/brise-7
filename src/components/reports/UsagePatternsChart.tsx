import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, Loader2 } from "lucide-react";
import { UsagePattern } from "@/hooks/useReportData";
import { useTranslation } from "react-i18next";

interface UsagePatternsChartProps {
  data: UsagePattern[];
  isLoading: boolean;
}

export const UsagePatternsChart = ({ data, isLoading }: UsagePatternsChartProps) => {
  const { t } = useTranslation();

  // Aggregate usage by hour across all days
  const hourlyUsage = Array.from({ length: 24 }, (_, hour) => {
    const usageForHour = data.filter((item) => item.hour === hour);
    const totalUsage = usageForHour.reduce((acc, item) => acc + item.usage, 0);
    return {
      hour: `${hour.toString().padStart(2, "0")}:00`,
      usage: totalUsage,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {t('charts.usagePatternsByHour')}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {t('charts.noData')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyUsage}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value} ${t('charts.activations')}`, t('charts.usage')]}
                labelFormatter={(label) => `${t('charts.time')}: ${label}`}
              />
              <Bar dataKey="usage" fill="url(#colorUsage)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
