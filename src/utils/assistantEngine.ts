import { AssistantContext } from '../types';
import { BUILDINGS, DISTRICTS, INITIAL_ALERTS } from '../data/mockData';

/**
 * Local deterministic context-aware assistant engine for NEXUS.
 * Synthesizes structured data from the active city view, selected building,
 * active alerts, scenarios, and risk scores into precise, authoritative responses.
 */
export function generateLocalAssistantResponse(
  prompt: string,
  context: AssistantContext
): string {
  const p = prompt.toLowerCase();
  const district = DISTRICTS.find((d) => d.id === context.selectedDistrict);
  const districtName = district ? district.name : 'Metro Aggregate';

  // 1. Inquiries about congestion / traffic
  if (p.includes('congestion') || p.includes('traffic') || p.includes('speed') || p.includes('transit')) {
    if (context.selectedDistrict === 'core-financial' || p.includes('financial') || p.includes('why')) {
      return `Traffic congestion in ${districtName} is currently elevated at 64% (averaging 38.4 km/h vs 65 km/h nominal design). 
The primary bottleneck is on the Financial Spine Arterial (ID: RD-02) where autonomous trailer stall (Incident ALT-1081) occupies Lane 2, reducing arterial throughput by ~35%. 
Recommended action: Divert inbound autonomous shuttles via Skyway Ring West and maintain Dynamic Green Wave signal priority.`;
    }
    return `Across ${districtName}, traffic flow velocity is averaging 38.4 km/h with a 64% congestion rating. 
Mobility sensors indicate 1 critical bottleneck on the Financial Spine Arterial, while Tech Parkway and Aurora Boulevard remain free-flowing (>50 km/h). Transit signal optimization is currently active across 342 intersection nodes.`;
  }

  // 2. Inquiries about building maintenance risk
  if (p.includes('maintenance') || p.includes('building') || p.includes('risk score') || p.includes('hazard')) {
    if (context.selectedBuilding) {
      const b = context.selectedBuilding;
      return `Telemetry audit for ${b.name} (${b.type}, ${b.districtName}):
• Height: ${b.heightMeters}m (${b.floors} floors)
• Instantaneous Load: ${b.energyUsageKwh.toLocaleString()} kWh (Energy Rating: ${b.energyRating})
• Occupancy: ${b.occupancyEstimate}% (~${b.occupancyCount.toLocaleString()} occupants)
• Operational Status: ${b.status}
• Maintenance Risk Index: ${b.maintenanceRiskScore}/100
• Primary Risk Factor: ${
        b.maintenanceRiskScore > 70
          ? 'Thermal saturation in transformer/inverter vault. Requires coolant flow check.'
          : 'Normal wear-and-tear degradation on secondary HVAC filters.'
      }
• Emergency Backup: ${b.backupPower}`;
    }

    const highRiskBuildings = BUILDINGS.filter((b) => b.maintenanceRiskScore >= 60);
    return `In the current city telemetry, the highest-risk structures requiring preventative maintenance are:
1. Quantum Data Center Sigma (Risk: 84/100, Alert status) - Inverter thermal spike in Vault B
2. Titan Maritime Logistics Tower (Risk: 68/100, Maintenance status) - Port gantry vibration drift
3. Vanguard Tower (Risk: 62/100, Optimizing status) - Kinetic façade actuator calibration

All other ${BUILDINGS.length - 3} structures are currently operating within nominal safety thresholds.`;
  }

  // 3. Inquiries about alerts / incidents
  if (p.includes('alert') || p.includes('incident') || p.includes('emergency') || p.includes('protocol')) {
    if (context.selectedAlert) {
      const a = context.selectedAlert;
      return `Incident Dossier for ${a.id} [${a.severity.toUpperCase()}]:
• Title: ${a.title}
• Sector: ${a.districtName} (${a.location})
• Status: ${a.status} (Logged: ${a.timestamp})
• Root Cause: ${a.description}
• Impacted Subsystems: ${a.affectedSystems.join(', ')}
• Recommended Protocol: ${a.recommendedAction}`;
    }
    return `There are currently 5 active operational incidents in the NEXUS ledger, including 2 Critical events:
1. ALT-1082 (Critical): Thermal spike on Substation 4 grid inverter at Quantum Data Center Sigma.
2. ALT-1081 (Critical): Severe traffic choke on Hyper-Corridor North due to sensor telemetry mismatch.
3. ALT-1080 (Warning): Particulate matter PM2.5 surge near Harbor Gantry (64.2 µg/m³).

Operators can acknowledge or resolve these incidents directly in the Alerts & Incidents console.`;
  }

  // 4. Inquiries about scenarios / policies
  if (p.includes('scenario') || p.includes('policy') || p.includes('simulation') || p.includes('compare')) {
    return `Scenario Simulator analysis:
Adjusting policy investments produces real-time modeled trade-offs:
• Expanding Public Transit (currently set at high intensity) reduces road congestion by ~28% and improves travel convenience.
• Aggressive Traffic Restrictions (>70) reduce emissions and queue lengths, but introduce travel inconvenience trade-offs for commercial logistics.
• Renewable Energy adoption increases clean grid share towards our 98% baseload asymptote.
• Building Efficiency reduces instantaneous peak load by ~5.2 MW per index point.
Saved scenarios can be benchmarked against baseline in the Scenario Simulator tab.`;
  }

  // 5. Inquiries about environmental / air quality / AQI
  if (p.includes('air') || p.includes('aqi') || p.includes('pollution') || p.includes('environment') || p.includes('pm2.5')) {
    return `Environmental Telemetry Summary:
• City-wide Average AQI: 34 (Optimal/Good band)
• Fine Particulate PM2.5: 11.4 µg/m³ (compliant with WHO <15 µg/m³ target)
• Greenest Sector: Green Belt (AQI 16 · Excellent, Carbon Bio-Dome scrubbing 40,000 m³/h)
• Most Polluted Sector: Neo Harbor (AQI 54 · Moderate, localized PM2.5 surge near Berth 14 due to ship aux generators)
• Renewable Grid Contribution: 48.2% (708.5 MW clean solar, tidal, and flow battery storage).`;
  }

  // 6. District summary
  if (p.includes('district') || p.includes('sector') || p.includes('summary')) {
    if (district) {
      return `Executive Briefing for ${district.name}:
• Character: ${district.tagline}
• Population: ${district.population.toLocaleString()} residents across ${district.areaSqKm} km²
• IoT Sensor Mesh: ${district.activeSensors.toLocaleString()} active nodes (100% online)
• Municipal Health Score: ${district.healthScore}/100
• Grid Power Load: ${district.energyDemandMW} MW
• Air Quality Index: ${district.avgAqi} AQI
• Traffic Index: ${district.trafficIndex}/100`;
    }
  }

  // Generic intelligent context-grounded response
  return `NEXUS Telemetry Intelligence reporting on ${districtName}:
The city digital-twin is actively tracking 24 landmarks, 5 urban sectors, and 22,710 connected sensor endpoints.
Active focus: Screen "${context.currentScreen}", District "${districtName}"${
    context.selectedBuilding ? `, Selected Facility "${context.selectedBuilding.name}"` : ''
  }${context.selectedAlert ? `, Selected Incident "${context.selectedAlert.id}"` : ''}.
All telemetry data represents synthetic demonstration data for urban operational decision support. How can I assist with your operational analysis?`;
}
