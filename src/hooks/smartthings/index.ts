// SmartThings Hooks - Consolidated module
export { useSmartThingsConfig } from "./useSmartThingsConfig";
export { useSmartThingsControl } from "./useSmartThingsControl";
export { useSmartThingsDevices } from "./useSmartThingsDevices";

// Re-export types for convenience
export type { SmartThingsConfig, SmartThingsDevice, SmartThingsAction, SmartThingsLocation } from "@/lib/smartthings";
