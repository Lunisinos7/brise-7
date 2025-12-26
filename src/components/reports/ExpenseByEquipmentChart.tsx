import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Wallet, Loader2 } from "lucide-react";
import { EquipmentExpense } from "@/hooks/useReportData";
import { useTranslation } from "react-i18next";

interface ExpenseByEquipmentChartProps {
  data: EquipmentExpense[];
  isLoading: boolean;
  currencySymbol: string;
}

const getExpenseColor = (expense: number, maxExpense: number) => {
  const ratio = expense / maxExpense;
  if (ratio >= 0.7) return "hsl(0, 80%, 55%)"; // high expense - red
  if (ratio >= 0.4) return "hsl(45, 80%, 55%)"; // medium expense - yellow
  return "hsl(165, 80%, 45%)"; // low expense - green
};

export const ExpenseByEquipmentChart = ({
  data,
  isLoading,
  currencySymbol
}: ExpenseByEquipmentChartProps) => {
  const { t } = useTranslation();

  const maxExpense = Math.max(...data.map(d => d.total_expense), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          {t('charts.expenseByEquipment')}
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
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                tickFormatter={(value) => `${currencySymbol} ${value.toFixed(0)}`}
              />
              <YAxis
                type="category"
                dataKey="equipment_name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [
                  `${currencySymbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  t('charts.expense')
                ]}
              />
              <Bar dataKey="total_expense" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getExpenseColor(entry.total_expense, maxExpense)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
