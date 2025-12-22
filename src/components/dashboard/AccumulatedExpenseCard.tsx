import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DollarSign, Loader2 } from "lucide-react";
import { useAccumulatedExpense } from "@/hooks/useAccumulatedExpense";

interface AccumulatedExpenseCardProps {
  workspaceId: string | null;
}

export const AccumulatedExpenseCard = ({ workspaceId }: AccumulatedExpenseCardProps) => {
  const { data, isLoading } = useAccumulatedExpense(workspaceId);

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-elevated",
      "border-energy-efficient/20 bg-gradient-to-br from-energy-efficient/10 to-transparent"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Gasto Acumulado
        </CardTitle>
        <DollarSign className="h-4 w-4 text-energy-efficient" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-bold">{data.totalKwh.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground ml-1">kWh</span>
            </div>
            <div className="text-muted-foreground">•</div>
            <div>
              <span className="text-2xl font-bold">
                {data.currencySymbol} {data.totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Desde 00:00
        </p>
      </CardContent>
    </Card>
  );
};
