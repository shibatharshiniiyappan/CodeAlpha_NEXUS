import { ScenarioPolicy, ScenarioImpactMetrics, SavedScenario } from '../types';

export const BASELINE_POLICY: ScenarioPolicy = {
  transitInvestment: 45,
  trafficRestrictions: 30,
  renewableAdoption: 50,
  buildingEfficiency: 40,
  greenSpaceInvestment: 35,
};

export const BASELINE_METRICS: ScenarioImpactMetrics = {
  trafficCongestionIndex: 64,        // 64%
  avgSpeedKmh: 38.4,                 // 38.4 km/h
  airQualityIndex: 42,               // 42 AQI
  pm25UgM3: 12.8,                    // 12.8 µg/m³
  energyDemandMW: 1470,              // 1,470 MW
  renewableSharePct: 48.2,           // 48.2%
  carbonEmissionsTonnes: 2840,       // 2,840 tonnes/day
  travelConvenienceIndex: 82,        // 82%
};

/**
 * Deterministic, bounded urban simulation model.
 * Incorporates realistic non-linear diminishing returns and multi-factor trade-offs.
 */
export function calculateScenarioProjections(
  policy: ScenarioPolicy
): ScenarioImpactMetrics {
  // 1. Traffic Congestion (%)
  // Influenced by transit investment (-0.26) and traffic restrictions (-0.30)
  const transitDelta = (policy.transitInvestment - BASELINE_POLICY.transitInvestment) * 0.28;
  const restrictionDelta = (policy.trafficRestrictions - BASELINE_POLICY.trafficRestrictions) * 0.32;
  const projectedCongestion = Math.max(
    14,
    Math.min(92, Math.round((BASELINE_METRICS.trafficCongestionIndex - transitDelta - restrictionDelta) * 10) / 10)
  );

  // 2. Average Speed (km/h)
  // Inverse relation to congestion, bounded by urban speed design (20 to 62 km/h)
  const projectedSpeed = Math.max(
    18,
    Math.min(62, Math.round((64 - projectedCongestion * 0.42) * 10) / 10)
  );

  // 3. Travel Convenience Index (Trade-off factor!)
  // Transit boosts convenience, BUT aggressive restrictions (>40) degrade convenience for delivery and private commuters
  const transitConvenienceGain = (policy.transitInvestment - BASELINE_POLICY.transitInvestment) * 0.25;
  const restrictionPenalty = Math.max(0, policy.trafficRestrictions - 35) * 0.52;
  const projectedConvenience = Math.max(
    25,
    Math.min(98, Math.round((BASELINE_METRICS.travelConvenienceIndex + transitConvenienceGain - restrictionPenalty) * 10) / 10)
  );

  // 4. Energy Demand (MW)
  // Building efficiency reduces grid demand with diminishing returns
  const efficiencyDelta = (policy.buildingEfficiency - BASELINE_POLICY.buildingEfficiency) * 5.2;
  const projectedEnergyDemand = Math.max(
    920,
    Math.min(1750, Math.round(BASELINE_METRICS.energyDemandMW - efficiencyDelta))
  );

  // 5. Renewable Share (%)
  // Renewable adoption increases share, but asymptotes near 98% due to baseload/spinning reserves
  const renewableDelta = (policy.renewableAdoption - BASELINE_POLICY.renewableAdoption) * 0.52;
  const rawRenewable = BASELINE_METRICS.renewableSharePct + renewableDelta;
  const projectedRenewable = Math.max(
    15,
    Math.min(98.5, Math.round(rawRenewable * 10) / 10)
  );

  // 6. Air Quality Index (AQI)
  // Congestion reduction + green space investment reduce pollutant concentrations
  const trafficAqiImpact = (BASELINE_METRICS.trafficCongestionIndex - projectedCongestion) * 0.24;
  const greenSpaceAqiImpact = (policy.greenSpaceInvestment - BASELINE_POLICY.greenSpaceInvestment) * 0.22;
  const projectedAqi = Math.max(
    12,
    Math.min(85, Math.round((BASELINE_METRICS.airQualityIndex - trafficAqiImpact - greenSpaceAqiImpact) * 10) / 10)
  );

  // 7. PM2.5 (µg/m³)
  const projectedPm25 = Math.max(
    3.8,
    Math.min(32, Math.round((projectedAqi * 0.29) * 10) / 10)
  );

  // 8. Carbon Emissions (tonnes/day)
  // Impacted by energy demand, renewable share, and fleet electrification/transit
  const energyCarbon = (projectedEnergyDemand * (1 - projectedRenewable / 100)) * 2.8;
  const transportCarbon = (projectedCongestion * 18.5) * (1 - policy.transitInvestment * 0.004);
  const projectedCarbon = Math.max(
    480,
    Math.round(energyCarbon + transportCarbon)
  );

  return {
    trafficCongestionIndex: projectedCongestion,
    avgSpeedKmh: projectedSpeed,
    airQualityIndex: projectedAqi,
    pm25UgM3: projectedPm25,
    energyDemandMW: projectedEnergyDemand,
    renewableSharePct: projectedRenewable,
    carbonEmissionsTonnes: projectedCarbon,
    travelConvenienceIndex: projectedConvenience,
  };
}

const LOCAL_STORAGE_SCENARIOS_KEY = 'nexus_saved_scenarios_v2';

export function getStoredScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SCENARIOS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse saved scenarios', e);
  }

  // Pre-seeded exemplary policy scenarios
  return [
    {
      id: 'scen-green-transit',
      name: 'Eco-Transit Accelerated Plan 2030',
      createdAt: '2026-10-08',
      policy: {
        transitInvestment: 85,
        trafficRestrictions: 45,
        renewableAdoption: 80,
        buildingEfficiency: 65,
        greenSpaceInvestment: 70,
      },
      results: calculateScenarioProjections({
        transitInvestment: 85,
        trafficRestrictions: 45,
        renewableAdoption: 80,
        buildingEfficiency: 65,
        greenSpaceInvestment: 70,
      }),
      notes: 'High municipal capital allocation toward autonomous light rail, solar façades, and urban canopy expansion.',
    },
    {
      id: 'scen-extreme-curb',
      name: 'Aggressive Congestion Zone Enforcement',
      createdAt: '2026-10-10',
      policy: {
        transitInvestment: 50,
        trafficRestrictions: 90,
        renewableAdoption: 55,
        buildingEfficiency: 40,
        greenSpaceInvestment: 35,
      },
      results: calculateScenarioProjections({
        transitInvestment: 50,
        trafficRestrictions: 90,
        renewableAdoption: 55,
        buildingEfficiency: 40,
        greenSpaceInvestment: 35,
      }),
      notes: 'Significant traffic reduction achieved, but reveals substantial citizen travel inconvenience trade-offs.',
    },
  ];
}

export function saveStoredScenarios(scenarios: SavedScenario[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_SCENARIOS_KEY, JSON.stringify(scenarios));
  } catch (e) {
    console.warn('Failed to persist scenarios to localStorage', e);
  }
}
