import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DollarSign, Loader2 } from "lucide-react";
import { useAccumulatedExpense } from "@/hooks/useAccumulatedExpense";
import { useTranslation } from "react-i18next";

interface AccumulatedExpenseCardProps {
  workspaceId: string | null;
}

export const AccumulatedExpenseCard = ({ workspaceId }: AccumulatedExpenseCardProps) => {
  const { t } = useTranslation();
  const { data, isLoading } = useAccumulatedExpense(workspaceId);

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-elevated",
      "border-primary/20 bg-gradient-to-br from-primary/10 to-transparent"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {t("dashboard.accumulatedExpense")}
        </CardTitle>
        <DollarSign className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("common.loading")}</span>
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
          {t("common.since")} 00:00
        </p>
      </CardContent>
    </Card>
  );
};
