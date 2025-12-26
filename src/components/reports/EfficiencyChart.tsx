import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { EquipmentEfficiency } from "@/hooks/useReportData";
import { useTranslation } from "react-i18next";
interface EfficiencyChartProps {
  data: EquipmentEfficiency[];
  isLoading: boolean;
}
const getEfficiencyColor = (efficiency: number) => {
  if (efficiency >= 85) return "hsl(165, 80%, 45%)"; // green
  if (efficiency >= 70) return "hsl(45, 80%, 55%)"; // yellow
  return "hsl(0, 80%, 55%)"; // red
};
export const EfficiencyChart = ({
  data,
  isLoading
}: EfficiencyChartProps) => {
  const {
    t
  } = useTranslation();
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t('charts.efficiencyByEquipment')}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {isLoading ? <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div> : data.length === 0 ? <div className="h-full flex items-center justify-center text-muted-foreground">
            {t('charts.noData')}
          </div> : <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" domain={[0, 100]} tick={{
            fontSize: 12
          }} tickLine={false} axisLine={false} className="fill-muted-foreground" tickFormatter={value => `${value}%`} />
              <YAxis type="category" dataKey="equipment_name" tick={{
            fontSize: 12
          }} tickLine={false} axisLine={false} className="fill-muted-foreground" width={120} />
              <Tooltip contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px"
          }} formatter={(value: number) => [`${value.toFixed(1)}%`, t('charts.efficiency')]} />
              <Bar dataKey="avg_efficiency" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={getEfficiencyColor(entry.avg_efficiency)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>}
      </CardContent>
    </Card>;
};