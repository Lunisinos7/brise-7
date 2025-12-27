export interface Equipment {
  id: string;
  name: string;
  location: string;
  isOn: boolean;
  currentTemp: number;
  targetTemp: number;
  mode: "cool" | "heat" | "auto" | "fan";
  energyConsumption: number;
  model: string;
  capacity: number; // BTU/h
  integration: "BRISE" | "SMART";
}

export interface Location {
  id: string;
  name: string;
  equipmentCount: number;
  activeEquipment: number;
  avgTemp: number;
  totalConsumption: number;
}

export const mockEquipments: Equipment[] = [
  {
    id: "1",
    name: "Sala de Reuniões A",
    location: "Térreo - Ala Norte",
    isOn: true,
    currentTemp: 22,
    targetTemp: 21,
    mode: "cool",
    energyConsumption: 1250,
    model: "Samsung AR12345",
    capacity: 12000,
    integration: "SMART"
  },
  {
    id: "2", 
    name: "Escritório Gerência",
    location: "1º Andar - Sala 101",
    isOn: true,
    currentTemp: 24,
    targetTemp: 23,
    mode: "cool",
    energyConsumption: 980,
    model: "LG Dual Inverter",
    capacity: 9000,
    integration: "BRISE"
  },
  {
    id: "3",
    name: "Auditório Principal", 
    location: "Térreo - Central",
    isOn: false,
    currentTemp: 26,
    targetTemp: 22,
    mode: "auto",
    energyConsumption: 0,
    model: "Daikin Split Hi-Wall",
    capacity: 18000,
    integration: "SMART"
  },
  {
    id: "4",
    name: "Laboratório TI",
    location: "2º Andar - Sala 205",
    isOn: true,
    currentTemp: 20,
    targetTemp: 19,
    mode: "cool",
    energyConsumption: 1850,
    model: "Hitachi Performance",
    capacity: 24000,
    integration: "SMART"
  },
  {
    id: "5",
    name: "Recepção",
    location: "Térreo - Entrada",
    isOn: true,
    currentTemp: 23,
    targetTemp: 22,
    mode: "auto",
    energyConsumption: 1100,
    model: "Midea Inverter",
    capacity: 12000,
    integration: "BRISE"
  },
  {
    id: "6",
    name: "Sala de Treinamento",
    location: "1º Andar - Sala 110",
    isOn: false,
    currentTemp: 25,
    targetTemp: 21,
    mode: "cool", 
    energyConsumption: 0,
    model: "Carrier Split",
    capacity: 18000,
    integration: "BRISE"
  }
];

export const mockLocations: Location[] = [
  {
    id: "1",
    name: "Térreo",
    equipmentCount: 3,
    activeEquipment: 2,
    avgTemp: 23.7,
    totalConsumption: 2350
  },
  {
    id: "2", 
    name: "1º Andar",
    equipmentCount: 2,
    activeEquipment: 1,
    avgTemp: 24.5,
    totalConsumption: 980
  },
  {
    id: "3",
    name: "2º Andar", 
    equipmentCount: 1,
    activeEquipment: 1,
    avgTemp: 20.0,
    totalConsumption: 1850
  }
];

export const mockAlerts = [
  {
    id: "1",
    type: "warning",
    message: "Laboratório TI - Temperatura muito baixa (19°C)",
    timestamp: new Date().toISOString(),
    equipment: "4"
  },
  {
    id: "2", 
    type: "info",
    message: "Auditório Principal desligado há 2 horas",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    equipment: "3"
  },
  {
    id: "3",
    type: "critical",
    message: "Sala de Treinamento - Eficiência abaixo de 85%",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), 
    equipment: "6"
  }
];