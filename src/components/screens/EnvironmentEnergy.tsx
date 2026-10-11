import React, { useState } from 'react';
import {
  Wind,
  Zap,
  Sun,
  Droplets,
  Activity,
  Gauge,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { DistrictId, TimeRange } from '../../types';
import {
  ENERGY_TIME_SERIES,
  AQI_TIME_SERIES,
  ENVIRONMENTAL_SENSORS,
  DISTRICTS,
} from '../../data/mockData';
import { InteractiveChart } from '../common/ChartWrapper';

interface EnvironmentEnergyProps {
  selectedDistrict: DistrictId;
  onSelectDistrict: (districtId: DistrictId) => void;
}

export const EnvironmentEnergy: React.FC<EnvironmentEnergyProps> = ({
  selectedDistrict,
  onSelectDistrict,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  // Filter sensors if district selected
  const filteredSensors = ENVIRONMENTAL_SENSORS.filter((s) => {
    if (selectedDistrict === 'all') return true;
    const dist = DISTRICTS.find((d) => d.id === selectedDistrict);
    return dist ? s.district.toLowerCase().includes(dist.name.toLowerCase().split(' ')[0]) : true;
  });

  return (
    <div className="space-y-6">
      {/* Time Range Selector & Screen Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#101B2C] border border-[#23354D] rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-[#F3F7FF] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#37D7FF]" />
            Atmospheric Quality & Microgrid Energy Telemetry
          </h2>
          <p className="text-xs text-[#8EA2BE] mt-0.5">
            Real-time urban environmental sensor mesh & renewable generation balance
          </p>
        </div>

        {/* Working Time Range Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0B1220] rounded-lg border border-[#23354D]">
          <span className="text-xs text-[#8EA2BE] px-2">Time Horizon:</span>
          {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                timeRange === range
                  ? 'bg-[#37D7FF] text-[#070B14] font-bold shadow-sm'
                  : 'text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#15243A]'
              }`}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Metro AQI */}
        <div className="p-4 bg-[#101B2C] border border-[#23354D] rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Average Air Quality</span>
            <Wind className="w-4 h-4 text-[#39D98A]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#39D98A]">
            34.2 <span className="text-xs font-normal text-[#8EA2BE]">AQI</span>
          </div>
          <div className="mt-1 text-[11px] text-[#39D98A] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Optimal Healthy Band (&lt;50)</span>
          </div>
        </div>

        {/* Metric 2: PM2.5 Fine Particles */}
        <div className="p-4 bg-[#101B2C] border border-[#23354D] rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>PM2.5 Density</span>
            <Gauge className="w-4 h-4 text-[#37D7FF]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#F3F7FF]">
            11.4 <span className="text-xs font-normal text-[#8EA2BE]">µg/m³</span>
          </div>
          <div className="mt-1 text-[11px] text-[#8EA2BE] flex items-center justify-between">
            <span>WHO Benchmark Target</span>
            <span className="font-mono text-[#39D98A]">15.0 max</span>
          </div>
        </div>

        {/* Metric 3: Total Load Demand */}
        <div className="p-4 bg-[#101B2C] border border-[#23354D] rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Active Power Demand</span>
            <Zap className="w-4 h-4 text-[#9B7BFF]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#F3F7FF]">
            1,470 <span className="text-xs font-normal text-[#8EA2BE]">MW</span>
          </div>
          <div className="mt-1 text-[11px] text-[#8EA2BE] flex items-center justify-between">
            <span>Grid Reserve Margin</span>
            <span className="font-mono text-[#37D7FF]">+24% Cushion</span>
          </div>
        </div>

        {/* Metric 4: Renewable Share */}
        <div className="p-4 bg-[#101B2C] border border-[#23354D] rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Renewable Mix Share</span>
            <Sun className="w-4 h-4 text-[#37D7FF]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#37D7FF]">
            48.2% <span className="text-xs font-normal text-[#8EA2BE]">Clean Energy</span>
          </div>
          <div className="mt-1 text-[11px] text-[#39D98A] flex items-center gap-1 font-mono">
            <span>708.5 MW Solar & Tidal</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row: Historical Energy & Air Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Chart */}
        <div className="p-5 bg-[#101B2C] border border-[#23354D] rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#F3F7FF]">
                Power Grid Demand vs Clean Generation ({timeRange.toUpperCase()})
              </h3>
              <p className="text-xs text-[#8EA2BE] mt-0.5">
                Total load requirements vs combined solar, tidal, and battery dispatch
              </p>
            </div>
            <span className="text-xs font-mono text-[#9B7BFF] bg-[#9B7BFF]/10 px-2 py-0.5 rounded border border-[#9B7BFF]/30">
              48.2% Clean
            </span>
          </div>
          <InteractiveChart
            data={ENERGY_TIME_SERIES[timeRange]}
            primaryLabel="Total Municipal Demand"
            secondaryLabel="Renewable Generation"
            primaryUnit="MW"
            secondaryUnit="MW"
            primaryColor="#37D7FF"
            secondaryColor="#9B7BFF"
            height={220}
          />
        </div>

        {/* Air Quality Chart */}
        <div className="p-5 bg-[#101B2C] border border-[#23354D] rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#F3F7FF]">
                Air Quality Index (AQI) & PM2.5 Profile ({timeRange.toUpperCase()})
              </h3>
              <p className="text-xs text-[#8EA2BE] mt-0.5">
                Continuous sensor readings across ambient monitoring stations
              </p>
            </div>
            <span className="text-xs font-mono text-[#39D98A] bg-[#39D98A]/10 px-2 py-0.5 rounded border border-[#39D98A]/30">
              AQI &lt; 50 Nominal
            </span>
          </div>
          <InteractiveChart
            data={AQI_TIME_SERIES[timeRange]}
            primaryLabel="Air Quality Index"
            secondaryLabel="PM2.5 (µg/m³)"
            primaryUnit="AQI"
            secondaryUnit="µg/m³"
            primaryColor="#39D98A"
            secondaryColor="#FFB84D"
            height={220}
          />
        </div>
      </div>

      {/* Environmental Sensor Stations Grid */}
      <div className="p-5 bg-[#101B2C] border border-[#23354D] rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F3F7FF]">
              Atmospheric Sensor Node Telemetry ({filteredSensors.length} Stations)
            </h3>
            <p className="text-xs text-[#8EA2BE]">
              Continuous multi-gas telemetry (NO₂, Ozone O₃, Temperature, Humidity)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8EA2BE]">Filter District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict(e.target.value as DistrictId)}
              className="bg-[#0B1220] border border-[#23354D] text-[#F3F7FF] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#37D7FF]"
            >
              <option value="all">All City Sectors</option>
              {DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSensors.map((sensor) => (
            <div
              key={sensor.id}
              className="p-4 rounded-xl bg-[#0B1220] border border-[#23354D] hover:border-[#37D7FF]/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#37D7FF] bg-[#37D7FF]/10 px-1.5 py-0.5 rounded">
                      {sensor.id}
                    </span>
                    <h4 className="text-sm font-semibold text-[#F3F7FF] mt-1.5">
                      {sensor.location}
                    </h4>
                    <p className="text-xs text-[#8EA2BE]">{sensor.district}</p>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      sensor.status === 'Nominal'
                        ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/30'
                        : 'bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/30'
                    }`}
                  >
                    {sensor.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#23354D]/50 text-xs">
                  <div>
                    <span className="text-[#8EA2BE]">AQI Index</span>
                    <div className="font-mono font-bold text-sm text-[#F3F7FF]">
                      {sensor.aqi}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#8EA2BE]">PM2.5</span>
                    <div className="font-mono font-bold text-sm text-[#37D7FF]">
                      {sensor.pm25} µg/m³
                    </div>
                  </div>
                  <div>
                    <span className="text-[#8EA2BE] flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-[#FFB84D]" /> Ambient
                    </span>
                    <div className="font-mono text-[#F3F7FF]">
                      {sensor.tempC}°C
                    </div>
                  </div>
                  <div>
                    <span className="text-[#8EA2BE] flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-[#37D7FF]" /> Humidity
                    </span>
                    <div className="font-mono text-[#F3F7FF]">
                      {sensor.humidity}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#23354D]/40 flex items-center justify-between text-[11px] text-[#8EA2BE]">
                <span>NO₂: {sensor.no2} ppb</span>
                <span>O₃: {sensor.o3} ppb</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* District Environmental Comparison Matrix */}
      <div className="p-5 bg-[#101B2C] border border-[#23354D] rounded-xl space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[#F3F7FF]">
            Sector Sustainability & Energy Matrix
          </h3>
          <p className="text-xs text-[#8EA2BE]">
            Cross-district benchmark of air quality, energy demand, and IoT sensor density
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#23354D]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B1220] text-[#8EA2BE] uppercase font-mono text-[10px] border-b border-[#23354D]">
              <tr>
                <th className="py-2.5 px-3">District Sector</th>
                <th className="py-2.5 px-3 text-right">Population</th>
                <th className="py-2.5 px-3 text-right">Air Quality (AQI)</th>
                <th className="py-2.5 px-3 text-right">Energy Demand</th>
                <th className="py-2.5 px-3 text-right">Active Sensors</th>
                <th className="py-2.5 px-3 text-right">Health Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23354D]/60 bg-[#101B2C]">
              {DISTRICTS.map((d) => (
                <tr key={d.id} className="hover:bg-[#15243A] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#F3F7FF] flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#37D7FF]" />
                    {d.name}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                    {d.population.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#39D98A] font-semibold">
                    {d.avgAqi} AQI
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#37D7FF]">
                    {d.energyDemandMW} MW
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                    {d.activeSensors.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#F3F7FF] font-semibold">
                    {d.healthScore}/100
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
