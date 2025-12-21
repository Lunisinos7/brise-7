import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Thermometer, Loader2 } from "lucide-react";
import { TemperatureData } from "@/hooks/useReportData";

interface TemperatureChartProps {
  data: TemperatureData[];
  isLoading: boolean;
}

export const TemperatureChart = ({ data, isLoading }: TemperatureChartProps) => {
  const formattedData = data.map((item) => ({
    ...item,
    dateFormatted: format(new Date(item.date), "dd/MM", { locale: ptBR }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-cooling" />
          Temperatura por Local
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateFormatted"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                domain={["dataMin - 2", "dataMax + 2"]}
                tickFormatter={(value) => `${value}°C`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}°C`,
                  name === "current_temp" ? "Temperatura Atual" : "Temperatura Alvo",
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Legend
                formatter={(value) =>
                  value === "current_temp" ? "Temperatura Atual" : "Temperatura Alvo"
                }
              />
              <Line
                type="monotone"
                dataKey="current_temp"
                stroke="hsl(195, 80%, 45%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="target_temp"
                stroke="hsl(165, 80%, 45%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
