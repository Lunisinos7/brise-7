import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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
  const { i18n } = useTranslation();
  
  if (!isSmartThings) return null;

  const isRecentlySync = lastSyncedAt && 
    (Date.now() - new Date(lastSyncedAt).getTime()) < 5 * 60 * 1000; // 5 minutes

  const localeMap: Record<string, string> = {
    'pt-BR': 'pt-BR',
    'en-US': 'en-US',
    'es-ES': 'es-ES',
  };

  const locale = localeMap[i18n.language] || 'pt-BR';

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
          {new Date(lastSyncedAt).toLocaleTimeString(locale, { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
    </div>
  );
}
