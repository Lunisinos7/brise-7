export interface BriseDevice {
  deviceId: string;
  name: string;
  model: string;
  location?: string;
  isOnline: boolean;
  currentTemp?: number;
  targetTemp?: number;
  mode?: string;
  isOn?: boolean;
  isImported?: boolean;
}

export interface BriseConfig {
  id: string;
  workspace_id: string;
  user_email: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export type BriseAction = 'turnOn' | 'turnOff' | 'setTemperature' | 'setMode';

export interface BriseCommandResult {
  success: boolean;
  error?: string;
  response?: any;
}
