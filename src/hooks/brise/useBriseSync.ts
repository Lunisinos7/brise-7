import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { useQueryClient } from "@tanstack/react-query";

const SYNC_INTERVAL_MS = 30000; // 30 seconds

interface BriseStatusResponse {
  statuses: Array<{
    deviceId: string;
    isOn: boolean;
    currentTemp: number;
    targetTemp: number;
    mode: string;
    fanSpeed: string;
    isOnline: boolean;
  }>;
  updated: number;
  error?: string;
}

export function useBriseSync(enabled: boolean = true) {
  const { currentWorkspaceId } = useWorkspaceContext();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  const syncStatus = useCallback(async (): Promise<BriseStatusResponse | null> => {
    if (!currentWorkspaceId || isSyncingRef.current) {
      return null;
    }

    isSyncingRef.current = true;

    try {
      const { data, error } = await supabase.functions.invoke("brise-status", {
        body: { workspaceId: currentWorkspaceId },
      });

      if (error) {
        console.error("[useBriseSync] Error fetching status:", error);
        return null;
      }

      if (data?.updated > 0) {
        // Invalidate equipment queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ["equipments"] });
      }

      return data as BriseStatusResponse;
    } catch (error) {
      console.error("[useBriseSync] Sync error:", error);
      return null;
    } finally {
      isSyncingRef.current = false;
    }
  }, [currentWorkspaceId, queryClient]);

  const startSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial sync
    syncStatus();

    // Set up interval
    intervalRef.current = setInterval(() => {
      syncStatus();
    }, SYNC_INTERVAL_MS);
  }, [syncStatus]);

  const stopSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled && currentWorkspaceId) {
      startSync();
    } else {
      stopSync();
    }

    return () => {
      stopSync();
    };
  }, [enabled, currentWorkspaceId, startSync, stopSync]);

  return {
    syncStatus,
    startSync,
    stopSync,
  };
}
