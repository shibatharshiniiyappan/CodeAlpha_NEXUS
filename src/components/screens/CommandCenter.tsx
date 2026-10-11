import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Wind,
  Navigation,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Box,
  CheckCircle2,
  Maximize2,
  ShieldAlert,
  Sliders,
  Sparkles,
  Layers,
  BarChart3,
  Globe,
  Radio,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { DistrictId, ScreenId, Alert } from '../../types';
import {
  DISTRICTS,
  BUILDINGS,
  ENERGY_TIME_SERIES,
  TRAFFIC_HOURLY_VOLUME,
  AQI_TIME_SERIES,
} from '../../data/mockData';
import { InteractiveChart } from '../common/ChartWrapper';
import { getPredictiveRiskAssessments } from '../../utils/predictiveRiskCalculations';
import { CityExplorer3D } from './CityExplorer3D';

interface CommandCenterProps {
  selectedDistrict: DistrictId;
  onSelectDistrict: (districtId: DistrictId) => void;
  onNavigate: (screen: ScreenId, entityId?: string) => void;
  alerts: Alert[];
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  selectedDistrict,
  onSelectDistrict,
  onNavigate,
  alerts,
}) => {
  const [viewMode, setViewMode] = useState<'hero-3d' | 'analytics'>('hero-3d');
  const currentDistrict = DISTRICTS.find((d) => d.id === selectedDistrict);
  const activeAlerts = alerts.filter((a) => a.status === 'Active');
  const criticalCount = activeAlerts.filter((a) => a.severity === 'Critical').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'Warning').length;

  const connectedBuildingsCount = BUILDINGS.filter((b) => b.isOnline).length;
  const risks24h = getPredictiveRiskAssessments('24h');
  const elevatedRisksCount = risks24h.filter(
    (r) => r.riskLevel === 'Critical' || r.riskLevel === 'High'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Operations Header with View Mode Switcher */}
      <div className="p-3 bg-[#10182A]/90 backdrop-blur-md border border-[#23354D] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="text-[#F3F7FF] font-semibold">
            NEXUS City Operations Center · Digital Twin Active
          </span>
          <span className="hidden md:inline text-[#8EA2BE]">
            · Synthetic telemetry synchronized across 5 districts
          </span>
        </div>

        {/* View Mode Toggle Button Group */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#070B16] p-1 rounded-lg border border-[#23354D]">
            <button
              onClick={() => setViewMode('hero-3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'hero-3d'
                  ? 'bg-[#00E5FF] text-[#070B16] shadow-md shadow-[#00E5FF]/20 font-bold'
                  : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3D Digital Twin Hero</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'analytics'
                  ? 'bg-[#00E5FF] text-[#070B16] shadow-md shadow-[#00E5FF]/20 font-bold'
                  : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Executive Analytics</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#00E5FF] bg-[#15243A] px-2 py-1 rounded border border-[#23354D]">
              LATENCY: 12ms
            </span>
            <span className="font-mono text-[11px] text-[#39D98A] bg-[#15243A] px-2 py-1 rounded border border-[#23354D]">
              HEALTH: 96.4%
            </span>
          </div>
        </div>
      </div>

      {/* 6 Core KPI Cards (Always visible or in analytics mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Connected Buildings */}
        <div
          onClick={() => onNavigate('buildings')}
          className="p-3.5 bg-[#10182A]/80 backdrop-blur-md hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-[#8EA2BE] font-medium">Connected Assets</span>
            <div className="p-1.5 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] group-hover:scale-110 transition-transform">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#F3F7FF]">
                {connectedBuildingsCount}/{BUILDINGS.length}
              </span>
              <span className="text-[10px] text-[#39D98A]">100% Online</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#8EA2BE]">24 Landmarks</span>
              <span className="text-[#00E5FF] group-hover:underline flex items-center">
                Buildings &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Traffic Congestion */}
        <div
          onClick={() => onNavigate('mobility')}
          className="p-3.5 bg-[#10182A]/80 backdrop-blur-md hover:bg-[#15243A] border border-[#23354D] hover:border-[#FFB84D]/50 rounded-xl transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-[#8EA2BE] font-medium">Traffic Congestion</span>
            <div className="p-1.5 rounded-lg bg-[#FFB84D]/10 text-[#FFB84D] group-hover:scale-110 transition-transform">
              <Navigation className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#FFB84D]">
                64%
              </span>
              <span className="text-[10px] text-[#8EA2BE]">Moderate</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#39D98A] font-mono">+3.8 km/h</span>
              <span className="text-[#FFB84D] group-hover:underline flex items-center">
                Mobility &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Average AQI */}
        <div
          onClick={() => onNavigate('environment')}
          className="p-3.5 bg-[#10182A]/80 backdrop-blur-md hover:bg-[#15243A] border border-[#23354D] hover:border-[#39D98A]/50 rounded-xl transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-[#8EA2BE] font-medium">Air Quality Index</span>
            <div className="p-1.5 rounded-lg bg-[#39D98A]/10 text-[#39D98A] group-hover:scale-110 transition-transform">
              <Wind className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#39D98A]">
                34
              </span>
              <span className="text-[10px] text-[#8EA2BE]">AQI · Good</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#39D98A] font-mono">-8.1% drop</span>
              <span className="text-[#39D98A] group-hover:underline flex items-center">
                Sensors &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Renewable Share */}
        <div
          onClick={() => onNavigate('environment')}
          className="p-3.5 bg-[#10182A]/80 backdrop-blur-md hover:bg-[#15243A] border border-[#23354D] hover:border-[#9B6DFF]/50 rounded-xl transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-[#8EA2BE] font-medium">Renewable Grid</span>
            <div className="p-1.5 rounded-lg bg-[#9B6DFF]/10 text-[#9B6DFF] group-hover:scale-110 transition-transform">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#00E5FF]">
                48.2%
              </span>
              <span className="text-[10px] text-[#8EA2BE]">Clean Energy</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#39D98A] font-mono">708.5 MW</span>
              <span className="text-[#9B6DFF] group-hover:underline flex items-center">
                Microgrid &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* KPI 5: Active Incidents */}
        <div
          onClick={() => onNavigate('alerts')}
          className="p-3.5 bg-[#10182A]/80 backdrop-blur-md hover:bg-[#15243A] border border-[#23354D] hover:border-[#FF5D73]/50 rounded-xl transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-[#8EA2BE] font-medium">Active Incidents</span>
            <div className="p-1.5 rounded-lg bg-[#FF5D73]/10 text-[#FF5D73] group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#FF5D73]">
                {activeAlerts.length}
              </span>
              <span className="text-[10px] text-[#FF5D73] font-semibold">{criticalCount} Critical</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#FFB84D] font-mono">{warningCount} Warn</span>
              <span className="text-[#FF5D73] group-hover:underline flex items-center">
                Alerts &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* KPI 6: Predicted High-Risk Events */}
        <div
          onClick={() => onNavigate('predictive-risk')}
          className="p-3.5 bg-[#10182A]/80 backdrop-blur-md hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] text-[#8EA2BE] font-medium">Forecast Risks</span>
            <div className="p-1.5 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono tabular-nums text-[#FFB84D]">
                {elevatedRisksCount} Elevated
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[#8EA2BE] font-mono">+24h Horizon</span>
              <span className="text-[#00E5FF] group-hover:underline flex items-center">
                Risk Engine &rarr;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: HERO 3D DIGITAL TWIN VIEW */}
      {viewMode === 'hero-3d' ? (
        <div className="space-y-6">
          {/* Main 3D Hero City Explorer Canvas */}
          <div className="relative">
            <CityExplorer3D
              selectedDistrict={selectedDistrict}
              onSelectDistrict={onSelectDistrict}
              onNavigate={onNavigate}
              alerts={alerts}
              isHeroMode={true}
            />
          </div>

          {/* Quick Decision Operations Bar Below 3D Canvas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Policy Scenario Simulator Callout */}
            <div
              onClick={() => onNavigate('scenario-simulator')}
              className="p-4 bg-[#10182A]/90 hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF]">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#00E5FF] transition-colors">
                      Urban Policy Simulator
                    </h4>
                    <span className="text-[10px] text-[#8EA2BE]">Interactive policy levers</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8EA2BE] group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-[#8EA2BE] mt-2.5 leading-relaxed">
                Test congestion pricing, EV transit incentives, and microgrid solar expansion with instant trade-off impact calculation.
              </p>
            </div>

            {/* Predictive Risk Engine Callout */}
            <div
              onClick={() => onNavigate('predictive-risk')}
              className="p-4 bg-[#10182A]/90 hover:bg-[#15243A] border border-[#23354D] hover:border-[#FFB84D]/50 rounded-xl transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#FFB84D]/10 text-[#FFB84D]">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#FFB84D] transition-colors">
                      Predictive Risk Engine
                    </h4>
                    <span className="text-[10px] text-[#8EA2BE]">Multi-horizon forecasts</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8EA2BE] group-hover:text-[#FFB84D] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-[#8EA2BE] mt-2.5 leading-relaxed">
                6-hour, 24-hour, and 7-day predictive early warning models for traffic bottlenecks, grid surges, and building maintenance.
              </p>
            </div>

            {/* Live Incidents & Triage Callout */}
            <div
              onClick={() => onNavigate('alerts')}
              className="p-4 bg-[#10182A]/90 hover:bg-[#15243A] border border-[#23354D] hover:border-[#FF5D73]/50 rounded-xl transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#FF5D73]/10 text-[#FF5D73]">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#F3F7FF] group-hover:text-[#FF5D73] transition-colors">
                      Operational Incidents
                    </h4>
                    <span className="text-[10px] text-[#FF5D73] font-mono">{criticalCount} Critical Priority</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8EA2BE] group-hover:text-[#FF5D73] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[11px] text-[#8EA2BE] mt-2.5 leading-relaxed">
                Review active incident telemetry, dispatch field crews, and inspect holographic beacon coordinates across sectors.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: EXECUTIVE ANALYTICS GRID */
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InteractiveChart
              data={ENERGY_TIME_SERIES['24h']}
              title="City-Wide Power Grid Demand & Generation (24 Hours)"
              height={220}
              primaryLabel="Total Grid Demand"
              secondaryLabel="Renewable Generation"
              primaryUnit="MW"
              secondaryUnit="MW"
              primaryColor="#9B6DFF"
              secondaryColor="#00E5FF"
            />

            <InteractiveChart
              data={TRAFFIC_HOURLY_VOLUME}
              title="Mobility Traffic Volume & Arterial Speeds (24 Hours)"
              height={220}
              primaryLabel="Traffic Volume"
              secondaryLabel="Average Speed"
              primaryUnit="veh/h"
              secondaryUnit="km/h"
              primaryColor="#FFB84D"
              secondaryColor="#39D98A"
            />
          </div>

          {/* District Status Matrix & Recent Incidents Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: District Telemetry Matrix */}
            <div className="lg:col-span-2 p-5 bg-[#10182A] border border-[#23354D] rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#F3F7FF]">
                    District Telemetry & Sensor Performance
                  </h3>
                  <p className="text-xs text-[#8EA2BE] mt-0.5">
                    Live environmental, mobility, and infrastructure indices
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('environment')}
                  className="text-xs text-[#00E5FF] hover:underline flex items-center gap-1"
                >
                  <span>Environmental Sensors</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#15243A] text-[#8EA2BE] uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Avg AQI</th>
                      <th className="py-2.5 px-3">Congestion</th>
                      <th className="py-2.5 px-3">Energy Load</th>
                      <th className="py-2.5 px-3">Buildings</th>
                      <th className="py-2.5 px-3">Active Alerts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#23354D]">
                    {DISTRICTS.map((dist) => {
                      const distAlerts = alerts.filter(
                        (a) => a.districtId === dist.id && a.status === 'Active'
                      );
                      const isSelected = selectedDistrict === dist.id;
                      const distBuildingCount = BUILDINGS.filter((b) => b.districtId === dist.id).length;

                      return (
                        <tr
                          key={dist.id}
                          onClick={() => onSelectDistrict(dist.id)}
                          className={`hover:bg-[#15243A]/70 cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#00E5FF]/5 border-l-2 border-[#00E5FF]' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[#F3F7FF] flex items-center gap-2">
                              <span>{dist.name}</span>
                              {isSelected && (
                                <span className="text-[9px] font-mono bg-[#00E5FF]/20 text-[#00E5FF] px-1 py-0.2 rounded">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#8EA2BE] block truncate max-w-[180px]">
                              {dist.tagline}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                dist.avgAqi < 25
                                  ? 'bg-[#39D98A]/20 text-[#39D98A]'
                                  : dist.avgAqi < 50
                                  ? 'bg-[#00E5FF]/20 text-[#00E5FF]'
                                  : 'bg-[#FFB84D]/20 text-[#FFB84D]'
                              }`}
                            >
                              {dist.avgAqi} AQI
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#070B16] rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    dist.trafficIndex > 70
                                      ? 'bg-[#FF5D73]'
                                      : dist.trafficIndex > 50
                                      ? 'bg-[#FFB84D]'
                                      : 'bg-[#39D98A]'
                                  }`}
                                  style={{ width: `${dist.trafficIndex}%` }}
                                />
                              </div>
                              <span className="text-[#F3F7FF]">{dist.trafficIndex}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[#00E5FF]">
                            {dist.energyDemandMW} MW
                          </td>
                          <td className="py-3 px-3 font-mono text-[#8EA2BE]">
                            {distBuildingCount} Assets
                          </td>
                          <td className="py-3 px-3">
                            {distAlerts.length > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-[#FF5D73]/20 text-[#FF5D73] font-bold font-mono">
                                {distAlerts.length} Active
                              </span>
                            ) : (
                              <span className="text-[#39D98A] flex items-center gap-1 font-mono text-[11px]">
                                <CheckCircle2 className="w-3 h-3" /> Nominal
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Col: Active Incidents Stream */}
            <div className="p-5 bg-[#10182A] border border-[#23354D] rounded-xl flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#F3F7FF] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FF5D73]" />
                    <span>Operations Triage Stream</span>
                  </h3>
                  <button
                    onClick={() => onNavigate('alerts')}
                    className="text-xs text-[#00E5FF] hover:underline"
                  >
                    View All ({alerts.length})
                  </button>
                </div>

                <div className="space-y-2.5 mt-2">
                  {activeAlerts.slice(0, 4).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => onNavigate('alerts', alert.id)}
                      className="p-3 bg-[#0B1120] hover:bg-[#15243A] border border-[#23354D] rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                            alert.severity === 'Critical'
                              ? 'bg-[#FF5D73]/20 text-[#FF5D73] border border-[#FF5D73]/40'
                              : alert.severity === 'Warning'
                              ? 'bg-[#FFB84D]/20 text-[#FFB84D] border border-[#FFB84D]/40'
                              : 'bg-[#00E5FF]/20 text-[#00E5FF]'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-[#8EA2BE] font-mono">
                          {alert.timestamp}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#F3F7FF] mt-1 group-hover:text-[#00E5FF] transition-colors line-clamp-1">
                        {alert.title}
                      </h4>
                      <p className="text-[11px] text-[#8EA2BE] line-clamp-2 mt-0.5">
                        {alert.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#8EA2BE]">
                        <span>{alert.districtName}</span>
                        <span className="text-[#00E5FF] group-hover:underline">Triage &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#23354D] mt-4">
                <button
                  onClick={() => onNavigate('alerts')}
                  className="w-full py-2 bg-[#15243A] hover:bg-[#1f3656] text-[#00E5FF] text-xs font-medium rounded-lg border border-[#23354D] transition-colors"
                >
                  Open Full Incident Response Console &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
