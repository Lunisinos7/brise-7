import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "cooling" | "heating" | "energy";
}

const StatusCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  variant = "default" 
}: StatusCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "cooling":
      case "heating":
      case "energy":
        return "border-primary/20 bg-gradient-to-br from-primary/10 to-transparent";
      default:
        return "border-border";
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case "cooling":
      case "heating":
      case "energy":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-elevated", getVariantStyles())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", getIconStyles())} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusCard;