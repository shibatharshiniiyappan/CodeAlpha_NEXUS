import React, { useState } from 'react';
import {
  Navigation,
  Gauge,
  Route,
  Activity,
  AlertTriangle,
  Radio,
  Sliders,
  CheckCircle,
  Clock,
  Compass,
} from 'lucide-react';
import { RoadSegment, DistrictId, CongestionLevel } from '../../types';
import { ROAD_SEGMENTS, TRAFFIC_HOURLY_VOLUME, DISTRICTS } from '../../data/mockData';
import { InteractiveChart } from '../common/ChartWrapper';

interface MobilityTrafficProps {
  selectedDistrict: DistrictId;
  onSelectDistrict: (districtId: DistrictId) => void;
  initialRoadId?: string;
}

export const MobilityTraffic: React.FC<MobilityTrafficProps> = ({
  selectedDistrict,
  onSelectDistrict,
  initialRoadId,
}) => {
  const [selectedRoad, setSelectedRoad] = useState<RoadSegment | null>(
    () => ROAD_SEGMENTS.find((r) => r.id === initialRoadId) || ROAD_SEGMENTS[0]
  );
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [signalOverrideActive, setSignalOverrideActive] = useState<boolean>(false);

  // Filter road segments
  const filteredRoads = ROAD_SEGMENTS.filter((road) => {
    const matchesDistrict =
      selectedDistrict === 'all' || road.districtId === selectedDistrict;
    const matchesSeverity =
      severityFilter === 'All' || road.congestionLevel === severityFilter;
    return matchesDistrict && matchesSeverity;
  });

  const getSeverityBadge = (level: CongestionLevel) => {
    switch (level) {
      case 'Severe':
        return 'bg-[#FF5D73]/20 text-[#FF5D73] border-[#FF5D73]/40';
      case 'Heavy':
        return 'bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/40';
      case 'Moderate':
        return 'bg-[#527BFF]/20 text-[#527BFF] border-[#527BFF]/40';
      case 'Low':
      default:
        return 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40';
    }
  };

  const getSegmentColor = (level: CongestionLevel) => {
    switch (level) {
      case 'Severe':
        return '#FF5D73';
      case 'Heavy':
        return '#FFB84D';
      case 'Moderate':
        return '#527BFF';
      case 'Low':
      default:
        return '#39D98A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Mobility Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#101B2C] border border-[#23354D] rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Average Corridor Speed</span>
            <Gauge className="w-4 h-4 text-[#37D7FF]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#F3F7FF]">
            38.4 <span className="text-xs font-normal text-[#8EA2BE]">km/h</span>
          </div>
          <div className="mt-1 text-[11px] text-[#39D98A] flex items-center gap-1 font-mono">
            <span>+3.8 km/h</span> <span className="text-[#8EA2BE]">vs morning peak</span>
          </div>
        </div>

        <div className="p-4 bg-[#101B2C] border border-[#23354D] rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Congestion Rating</span>
            <Activity className="w-4 h-4 text-[#FFB84D]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#FFB84D]">
            64% <span className="text-xs font-normal text-[#8EA2BE]">Moderate</span>
          </div>
          <div className="mt-1 text-[11px] text-[#8EA2BE] flex items-center justify-between">
            <span>Critical Hotspots</span>
            <span className="font-mono text-[#FF5D73] font-semibold">1 Arterial</span>
          </div>
        </div>

        <div className="p-4 bg-[#101B2C] border border-[#23354D] rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Autonomous Fleet</span>
            <Route className="w-4 h-4 text-[#39D98A]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#F3F7FF]">
            1,480 <span className="text-xs font-normal text-[#8EA2BE]">Units active</span>
          </div>
          <div className="mt-1 text-[11px] text-[#39D98A] flex items-center gap-1 font-mono">
            <span>99.2% on-schedule</span>
          </div>
        </div>

        <div className="p-4 bg-[#101B2C] border border-[#23354D] rounded-xl">
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Transit Signal Priority</span>
            <Radio className="w-4 h-4 text-[#527BFF]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#37D7FF]">
            Dynamic <span className="text-xs font-normal text-[#8EA2BE]">Green Wave</span>
          </div>
          <div className="mt-1 text-[11px] text-[#8EA2BE] flex items-center justify-between">
            <span>Intersection Nodes</span>
            <span className="font-mono text-[#F3F7FF]">342 Linked</span>
          </div>
        </div>
      </div>

      {/* Stylized Interactive Road Map & Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Stylized City Road Map SVG */}
        <div className="lg:col-span-2 p-5 bg-[#101B2C] border border-[#23354D] rounded-xl flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#F3F7FF] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#37D7FF]" />
                Arterial Highway & Transit Topology
              </h2>
              <p className="text-xs text-[#8EA2BE] mt-0.5">
                Click any transit corridor to inspect dynamic telemetry & signal timings
              </p>
            </div>

            {/* Severity Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs bg-[#0B1220] px-3 py-1.5 rounded-lg border border-[#23354D]">
              <span className="text-[#8EA2BE] text-[11px]">Flow Legend:</span>
              <span className="flex items-center gap-1 text-[#39D98A]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#39D98A]" />
                Low (Fast)
              </span>
              <span className="flex items-center gap-1 text-[#527BFF]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#527BFF]" />
                Moderate
              </span>
              <span className="flex items-center gap-1 text-[#FFB84D]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFB84D]" />
                Heavy
              </span>
              <span className="flex items-center gap-1 text-[#FF5D73]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5D73]" />
                Severe
              </span>
            </div>
          </div>

          {/* Interactive Vector Road Canvas */}
          <div className="relative w-full h-[360px] bg-[#070B14] rounded-lg border border-[#23354D] overflow-hidden flex items-center justify-center p-2">
            <svg
              viewBox="-70 -60 140 120"
              className="w-full h-full select-none cursor-pointer"
            >
              <defs>
                <pattern
                  id="map-grid"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 10 0 L 0 0 0 10"
                    fill="none"
                    stroke="#15243A"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>

              <rect x="-70" y="-60" width="140" height="120" fill="url(#map-grid)" />

              {/* District Zone Outlines */}
              <circle cx="0" cy="0" r="28" fill="#15243A" fillOpacity="0.2" stroke="#23354D" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="0" y="2" fill="#8EA2BE" fontSize="3" textAnchor="middle" opacity="0.6">CORE FINANCIAL</text>

              <circle cx="45" cy="28" r="22" fill="#15243A" fillOpacity="0.2" stroke="#23354D" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="45" y="30" fill="#8EA2BE" fontSize="3" textAnchor="middle" opacity="0.6">NEO HARBOR</text>

              <circle cx="-42" cy="28" r="22" fill="#15243A" fillOpacity="0.2" stroke="#23354D" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="-42" y="30" fill="#8EA2BE" fontSize="3" textAnchor="middle" opacity="0.6">TECH CORRIDOR</text>

              <circle cx="-35" cy="-35" r="20" fill="#15243A" fillOpacity="0.2" stroke="#23354D" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="-35" y="-33" fill="#8EA2BE" fontSize="3" textAnchor="middle" opacity="0.6">AURORA RESIDENTIAL</text>

              <circle cx="35" cy="-35" r="20" fill="#15243A" fillOpacity="0.2" stroke="#23354D" strokeWidth="0.5" strokeDasharray="2 2" />
              <text x="35" y="-33" fill="#8EA2BE" fontSize="3" textAnchor="middle" opacity="0.6">GREEN BELT</text>

              {/* Interactive Road Lines */}
              {ROAD_SEGMENTS.map((road) => {
                const isSelected = selectedRoad?.id === road.id;
                const strokeColor = getSegmentColor(road.congestionLevel);

                return (
                  <g
                    key={road.id}
                    onClick={() => setSelectedRoad(road)}
                    className="cursor-pointer group"
                  >
                    {/* Glow backdrop when selected */}
                    {isSelected && (
                      <line
                        x1={road.coordinates.x1}
                        y1={road.coordinates.y1}
                        x2={road.coordinates.x2}
                        y2={road.coordinates.y2}
                        stroke="#37D7FF"
                        strokeWidth="7"
                        strokeOpacity="0.4"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Road line base */}
                    <line
                      x1={road.coordinates.x1}
                      y1={road.coordinates.y1}
                      x2={road.coordinates.x2}
                      y2={road.coordinates.y2}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? '4' : '2.5'}
                      strokeLinecap="round"
                      className="transition-all"
                    />

                    {/* Animated dashes for vehicles in motion */}
                    <line
                      x1={road.coordinates.x1}
                      y1={road.coordinates.y1}
                      x2={road.coordinates.x2}
                      y2={road.coordinates.y2}
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      strokeDasharray="2 6"
                      strokeLinecap="round"
                      opacity="0.8"
                    />

                    {/* Intersection Nodes */}
                    <circle
                      cx={road.coordinates.x1}
                      cy={road.coordinates.y1}
                      r={isSelected ? 2.5 : 1.8}
                      fill={strokeColor}
                      stroke="#070B14"
                      strokeWidth="0.6"
                    />
                    <circle
                      cx={road.coordinates.x2}
                      cy={road.coordinates.y2}
                      r={isSelected ? 2.5 : 1.8}
                      fill={strokeColor}
                      stroke="#070B14"
                      strokeWidth="0.6"
                    />

                    {/* Incident Icon pin if road has active incident */}
                    {road.incidentsActive > 0 && (
                      <circle
                        cx={(road.coordinates.x1 + road.coordinates.x2) / 2}
                        cy={(road.coordinates.y1 + road.coordinates.y2) / 2}
                        r="3"
                        fill="#FF5D73"
                        stroke="#070B14"
                        strokeWidth="0.8"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Selected overlay tag */}
            {selectedRoad && (
              <div className="absolute top-3 left-3 bg-[#101B2C]/90 backdrop-blur-md border border-[#23354D] px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getSegmentColor(selectedRoad.congestionLevel) }}
                />
                <span className="font-semibold text-[#F3F7FF]">{selectedRoad.name}</span>
                <span className="font-mono text-[11px] text-[#8EA2BE]">
                  ({selectedRoad.avgSpeedKmh} km/h)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Road Details & Signal Control Panel */}
        <div className="p-5 bg-[#101B2C] border border-[#23354D] rounded-xl flex flex-col justify-between space-y-4">
          {selectedRoad ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#37D7FF] bg-[#37D7FF]/10 px-2 py-0.5 rounded border border-[#37D7FF]/20">
                    {selectedRoad.districtName}
                  </span>
                  <h3 className="text-base font-bold text-[#F3F7FF] mt-1.5">
                    {selectedRoad.name}
                  </h3>
                  <p className="text-xs text-[#8EA2BE]">
                    Arterial Segment ID: {selectedRoad.id.toUpperCase()}
                  </p>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded border ${getSeverityBadge(
                    selectedRoad.congestionLevel
                  )}`}
                >
                  {selectedRoad.congestionLevel} Congestion
                </span>
              </div>

              {/* Road metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-[#0B1220] border border-[#23354D]/60">
                  <div className="text-[11px] text-[#8EA2BE]">Flow Velocity</div>
                  <div className="mt-1 text-base font-bold font-mono tabular-nums text-[#F3F7FF]">
                    {selectedRoad.avgSpeedKmh}{' '}
                    <span className="text-xs text-[#8EA2BE]">/ {selectedRoad.speedLimitKmh} km/h</span>
                  </div>
                  <div className="text-[10px] text-[#8EA2BE]">
                    {Math.round((selectedRoad.avgSpeedKmh / selectedRoad.speedLimitKmh) * 100)}% of Limit
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0B1220] border border-[#23354D]/60">
                  <div className="text-[11px] text-[#8EA2BE]">Volume Throughput</div>
                  <div className="mt-1 text-base font-bold font-mono tabular-nums text-[#37D7FF]">
                    {selectedRoad.flowVehiclesPerHour.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#8EA2BE]">Vehicles / Hour</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0B1220] border border-[#23354D]/60">
                  <div className="text-[11px] text-[#8EA2BE]">Corridor Length</div>
                  <div className="mt-1 text-base font-bold font-mono tabular-nums text-[#F3F7FF]">
                    {selectedRoad.lengthKm} km
                  </div>
                  <div className="text-[10px] text-[#8EA2BE]">Continuous LiDAR coverage</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0B1220] border border-[#23354D]/60">
                  <div className="text-[11px] text-[#8EA2BE]">Active Blockades</div>
                  <div className={`mt-1 text-base font-bold font-mono tabular-nums ${
                    selectedRoad.incidentsActive > 0 ? 'text-[#FF5D73]' : 'text-[#39D98A]'
                  }`}>
                    {selectedRoad.incidentsActive} Incident{selectedRoad.incidentsActive !== 1 ? 's' : ''}
                  </div>
                  <div className="text-[10px] text-[#8EA2BE]">
                    {selectedRoad.detourAvailable ? 'Detours Available' : 'No Alt Bypass'}
                  </div>
                </div>
              </div>

              {/* Smart Signal Timing Status & Controls */}
              <div className="p-3 bg-[#15243A] rounded-lg border border-[#23354D] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8EA2BE] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#37D7FF]" />
                    Signal State:
                  </span>
                  <span className="font-mono text-[#37D7FF] font-semibold">
                    {signalOverrideActive ? 'Forced Green Wave Override' : selectedRoad.smartSignalStatus}
                  </span>
                </div>

                <p className="text-[11px] text-[#8EA2BE]">
                  {signalOverrideActive
                    ? 'Automated signal priority forced to maximum throughput duration (90s green cycle).'
                    : 'Corridor running AI-governed adaptive signal timing to equalize queue lengths.'}
                </p>

                <button
                  onClick={() => setSignalOverrideActive(!signalOverrideActive)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    signalOverrideActive
                      ? 'bg-[#39D98A] text-[#070B14] hover:bg-[#2db873]'
                      : 'bg-[#101B2C] text-[#37D7FF] hover:bg-[#1a2f4c] border border-[#37D7FF]/40'
                  }`}
                >
                  {signalOverrideActive ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Override Engaged (Click to Reset)
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      Engage Green Wave Signal Priority
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#8EA2BE]">
              Select a roadway corridor to display telemetry.
            </div>
          )}
        </div>
      </div>

      {/* Traffic Filter & Data Table Section */}
      <div className="p-5 bg-[#101B2C] border border-[#23354D] rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F3F7FF]">
              Monitored Corridors & Roadway Queue Index ({filteredRoads.length})
            </h3>
            <p className="text-xs text-[#8EA2BE]">
              Filter arterial networks by district or congestion severity
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Severity Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#0B1220] rounded-lg border border-[#23354D] text-xs">
              {['All', 'Low', 'Moderate', 'Heavy', 'Severe'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    severityFilter === sev
                      ? 'bg-[#15243A] text-[#37D7FF] font-semibold border border-[#23354D]'
                      : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* District Selector */}
            <select
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict(e.target.value as DistrictId)}
              className="bg-[#0B1220] border border-[#23354D] text-[#F3F7FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#37D7FF]"
            >
              <option value="all">All Sectors</option>
              {DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* High-density Data Table */}
        <div className="overflow-x-auto rounded-lg border border-[#23354D]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B1220] text-[#8EA2BE] uppercase font-mono text-[10px] border-b border-[#23354D]">
              <tr>
                <th className="py-2.5 px-3">Corridor Name</th>
                <th className="py-2.5 px-3">District Sector</th>
                <th className="py-2.5 px-3 text-right">Avg Speed</th>
                <th className="py-2.5 px-3 text-right">Volume</th>
                <th className="py-2.5 px-3">Congestion</th>
                <th className="py-2.5 px-3">Signal Mode</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23354D]/60 bg-[#101B2C]">
              {filteredRoads.map((road) => {
                const isSelected = selectedRoad?.id === road.id;
                return (
                  <tr
                    key={road.id}
                    onClick={() => setSelectedRoad(road)}
                    className={`hover:bg-[#15243A] cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#15243A]/80 font-medium' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-[#F3F7FF] flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-[#37D7FF]" />
                      {road.name}
                    </td>
                    <td className="py-2.5 px-3 text-[#8EA2BE]">{road.districtName}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#F3F7FF]">
                      {road.avgSpeedKmh} km/h
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#37D7FF]">
                      {road.flowVehiclesPerHour.toLocaleString()} v/h
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded border ${getSeverityBadge(
                          road.congestionLevel
                        )}`}
                      >
                        {road.congestionLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#8EA2BE]">
                      {road.smartSignalStatus}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoad(road);
                        }}
                        className="text-[#37D7FF] hover:underline font-mono text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
