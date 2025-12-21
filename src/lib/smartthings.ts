export interface SmartThingsDevice {
  deviceId: string;
  name: string;
  manufacturerName: string;
  model: string;
  locationId: string;
  roomId?: string;
  capabilities: string[];
  isImported: boolean;
}

export interface SmartThingsLocation {
  locationId: string;
  name: string;
}

export interface SmartThingsConfig {
  id: string;
  personal_access_token: string;
  location_id: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SmartThingsAction = 
  | 'turnOn' 
  | 'turnOff' 
  | 'setTemperature' 
  | 'setMode' 
  | 'setFanSpeed';

export interface SmartThingsCommand {
  deviceId: string;
  action: SmartThingsAction;
  value?: string | number;
}
