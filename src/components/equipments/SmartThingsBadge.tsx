import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartThingsBadgeProps {
  isSmartThings: boolean;
  lastSyncedAt?: string | null;
  showSyncStatus?: boolean;
  className?: string;
}

export function SmartThingsBadge({ 
  isSmartThings, 
  lastSyncedAt, 
  showSyncStatus = false,
  className 
}: SmartThingsBadgeProps) {
  if (!isSmartThings) return null;

  const isRecentlySync = lastSyncedAt && 
    (Date.now() - new Date(lastSyncedAt).getTime()) < 5 * 60 * 1000; // 5 minutes

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant="outline" 
        className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs"
      >
        <Wifi className="h-3 w-3 mr-1" />
        SmartThings
      </Badge>
      
      {showSyncStatus && lastSyncedAt && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {isRecentlySync ? (
            <RefreshCw className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-yellow-500" />
          )}
          {new Date(lastSyncedAt).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
    </div>
  );
}
