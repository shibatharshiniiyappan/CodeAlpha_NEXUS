export type ScreenId =
  | 'cinematic-landing'
  | 'command-center'
  | 'city-explorer'
  | 'scenario-simulator'
  | 'predictive-risk'
  | 'mobility'
  | 'environment'
  | 'alerts'
  | 'buildings';

export type DistrictId =
  | 'all'
  | 'core-financial'
  | 'neo-harbor'
  | 'tech-corridor'
  | 'aurora-residential'
  | 'green-belt';

export interface District {
  id: DistrictId;
  name: string;
  tagline: string;
  areaSqKm: number;
  population: number;
  activeSensors: number;
  healthScore: number;
  energyDemandMW: number;
  avgAqi: number;
  trafficIndex: number;
  coordinates: { x: number; z: number };
}

export type BuildingType =
  | 'Commercial'
  | 'Residential'
  | 'Research & AI'
  | 'Municipal'
  | 'Data Center'
  | 'Transit Hub'
  | 'Hospital'
  | 'Education';

export type OperationalStatus = 'Nominal' | 'Maintenance' | 'Alert' | 'Optimizing';

export interface Building {
  id: string;
  name: string;
  type: BuildingType;
  districtId: DistrictId;
  districtName: string;
  floors: number;
  heightMeters: number;
  energyUsageKwh: number;
  energyRating: string;
  occupancyEstimate: number; // percentage
  occupancyCount: number;
  status: OperationalStatus;
  isOnline: boolean;
  maintenanceRiskScore: number; // 0 - 100
  maintenanceHistory: { date: string; action: string; technician: string }[];
  solarCapacityKw: number;
  backupPower: string;
  hvacEfficiency: number; // percentage
  networkStatus: string;
  position3D: { x: number; y: number; z: number };
  size3D: { w: number; h: number; d: number };
  colorHex: string;
  description: string;
  relatedAlertIds?: string[];
}

export type AlertSeverity = 'Critical' | 'Warning' | 'Moderate' | 'Resolved';
export type AlertCategory = 'Traffic' | 'Energy' | 'Environment' | 'Infrastructure' | 'Public Safety';
export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved';

export interface Alert {
  id: string;
  title: string;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  districtId: DistrictId;
  districtName: string;
  location: string;
  timestamp: string;
  description: string;
  affectedSystems: string[];
  recommendedAction: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  relatedBuildingId?: string;
}

export type CongestionLevel = 'Low' | 'Moderate' | 'Heavy' | 'Severe';

export interface RoadSegment {
  id: string;
  name: string;
  districtId: DistrictId;
  districtName: string;
  avgSpeedKmh: number;
  speedLimitKmh: number;
  congestionLevel: CongestionLevel;
  flowVehiclesPerHour: number;
  lengthKm: number;
  incidentsActive: number;
  smartSignalStatus: 'Dynamic Green Wave' | 'Balancing Queue' | 'Emergency Priority' | 'Standard';
  detourAvailable: boolean;
  coordinates: { x1: number; y1: number; x2: number; y2: number };
}

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  unit?: string;
  trend: string;
  isPositiveTrend: boolean;
  targetScreen: ScreenId;
  description: string;
  secondaryText: string;
}

export type TimeRange = '24h' | '7d' | '30d';

export interface TimeSeriesPoint {
  timeLabel: string;
  value: number;
  secondaryValue?: number;
  target?: number;
  isProjected?: boolean;
}

// Scenario Simulator Types
export interface ScenarioPolicy {
  transitInvestment: number;      // 0 - 100
  trafficRestrictions: number;    // 0 - 100
  renewableAdoption: number;      // 0 - 100
  buildingEfficiency: number;     // 0 - 100
  greenSpaceInvestment: number;   // 0 - 100
}

export interface ScenarioImpactMetrics {
  trafficCongestionIndex: number;  // 0 - 100 %
  avgSpeedKmh: number;             // km/h
  airQualityIndex: number;         // AQI (<50 good)
  pm25UgM3: number;                // µg/m³
  energyDemandMW: number;          // MW
  renewableSharePct: number;       // %
  carbonEmissionsTonnes: number;   // tonnes/day
  travelConvenienceIndex: number;  // 0 - 100 % (trade-off)
}

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string;
  policy: ScenarioPolicy;
  results: ScenarioImpactMetrics;
  notes?: string;
}

// Predictive Risk Engine Types
export type RiskCategory = 'traffic' | 'air-quality' | 'energy' | 'infrastructure';
export type RiskHorizon = '6h' | '24h' | '7d';
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface RiskAssessment {
  id: string;
  category: RiskCategory;
  title: string;
  currentValue: number;
  forecastValue: number;
  unit: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  trend: 'increasing' | 'stable' | 'decreasing';
  contributingFactors: { factor: string; weightPct: number; explanation: string }[];
  confidencePct: number;
  suggestedMitigation: string;
  calculationMethod: string;
  timeHorizon: RiskHorizon;
  chartData: TimeSeriesPoint[];
  relatedAlertId?: string;
  relatedDistrictId?: DistrictId;
}

// Assistant Types
export interface AssistantContext {
  currentScreen: ScreenId;
  selectedDistrict: DistrictId;
  districtName?: string;
  selectedBuilding?: Building | null;
  selectedAlert?: Alert | null;
  activeLayers: {
    traffic: boolean;
    energy: boolean;
    airQuality: boolean;
    buildingHealth: boolean;
    incidents: boolean;
  };
  activePolicy?: ScenarioPolicy;
  activeRiskCount?: number;
  highRiskCategories?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isAiGenerated?: boolean;
  modelUsed?: string;
}
