// BRISE Hooks - Consolidated module
export { useBriseConfig } from "./useBriseConfig";
export { useBriseControl } from "./useBriseControl";
export { useBriseDevices } from "./useBriseDevices";
export { useBriseSync } from "./useBriseSync";

// Re-export types for convenience
export type { BriseConfig, BriseDevice, BriseAction } from "@/lib/brise";
