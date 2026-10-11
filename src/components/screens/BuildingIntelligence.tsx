import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  Zap,
  Users,
  Activity,
  ArrowLeft,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowUpDown,
  Box,
  Wrench,
} from 'lucide-react';
import { Building, BuildingType, DistrictId, ScreenId } from '../../types';
import { BUILDINGS, DISTRICTS, ENERGY_TIME_SERIES } from '../../data/mockData';
import { InteractiveChart } from '../common/ChartWrapper';

interface BuildingIntelligenceProps {
  selectedDistrict: DistrictId;
  onSelectDistrict: (districtId: DistrictId) => void;
  onNavigate: (screen: ScreenId, entityId?: string) => void;
  initialBuildingId?: string;
}

type SortField = 'name' | 'energy' | 'risk';

export const BuildingIntelligence: React.FC<BuildingIntelligenceProps> = ({
  selectedDistrict,
  onSelectDistrict,
  onNavigate,
  initialBuildingId,
}) => {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    () => (initialBuildingId ? BUILDINGS.find((b) => b.id === initialBuildingId) || null : null)
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortField>('risk');
  const [activeTab, setActiveTab] = useState<'telemetry' | 'maintenance'>('telemetry');

  // Stats
  const totalRegistered = BUILDINGS.length;
  const onlineCount = BUILDINGS.filter((b) => b.isOnline).length;
  const highRiskCount = BUILDINGS.filter((b) => b.maintenanceRiskScore >= 60).length;

  // Filter & sort buildings
  const filteredBuildings = BUILDINGS.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.districtName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDistrict =
      selectedDistrict === 'all' || b.districtId === selectedDistrict;

    const matchesType = typeFilter === 'All' || b.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;

    return matchesSearch && matchesDistrict && matchesType && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'energy') return b.energyUsageKwh - a.energyUsageKwh;
    if (sortBy === 'risk') return b.maintenanceRiskScore - a.maintenanceRiskScore;
    return 0;
  });

  const buildingTypes: (BuildingType | 'All')[] = [
    'All',
    'Commercial',
    'Residential',
    'Research & AI',
    'Municipal',
    'Data Center',
    'Transit Hub',
    'Hospital',
    'Education',
  ];

  return (
    <div className="space-y-6">
      {/* If a building is selected, show the Comprehensive Detailed View */}
      {selectedBuilding ? (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Back Navigation & Focus in 3D Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#10182A] border border-[#23354D] rounded-xl">
            <button
              onClick={() => setSelectedBuilding(null)}
              className="flex items-center gap-2 text-xs font-semibold text-[#00E5FF] hover:text-white px-3 py-1.5 bg-[#15243A] hover:bg-[#1f3656] border border-[#23354D] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Facilities Directory</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('city-explorer', selectedBuilding.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00E5FF] hover:bg-[#28bade] text-[#070B16] font-bold rounded-lg text-xs transition-colors shadow-md shadow-[#00E5FF]/20"
              >
                <Box className="w-3.5 h-3.5" />
                <span>Focus in 3D City Twin</span>
              </button>
            </div>
          </div>

          {/* Building Hero Dossier */}
          <div className="p-6 bg-[#10182A] border border-[#23354D] rounded-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#00E5FF] bg-[#00E5FF]/10 px-2.5 py-0.5 rounded border border-[#00E5FF]/30">
                    {selectedBuilding.type}
                  </span>
                  <span className="text-xs text-[#8EA2BE]">·</span>
                  <span className="text-xs text-[#8EA2BE] font-mono">
                    ASSET ID: {selectedBuilding.id.toUpperCase()}
                  </span>
                  <span className="text-xs text-[#8EA2BE]">·</span>
                  <span className="text-xs text-[#39D98A] font-mono">
                    {selectedBuilding.isOnline ? '● Online' : '○ Offline'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[#F3F7FF] mt-2">
                  {selectedBuilding.name}
                </h2>
                <p className="text-xs text-[#8EA2BE] mt-1">
                  Location: {selectedBuilding.districtName} Sector · Spatial Coords (
                  {selectedBuilding.position3D.x}, {selectedBuilding.position3D.z})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-xs font-mono rounded-lg border ${
                    selectedBuilding.status === 'Nominal'
                      ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                      : selectedBuilding.status === 'Alert'
                      ? 'bg-[#FF5D73]/20 text-[#FF5D73] border-[#FF5D73]/40'
                      : 'bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/40'
                  }`}
                >
                  {selectedBuilding.status}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-mono rounded-lg border ${
                    selectedBuilding.maintenanceRiskScore >= 75
                      ? 'bg-[#FF5D73]/20 text-[#FF5D73] border-[#FF5D73]/40'
                      : selectedBuilding.maintenanceRiskScore >= 60
                      ? 'bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/40'
                      : 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40'
                  }`}
                >
                  Risk: {selectedBuilding.maintenanceRiskScore}/100
                </span>
                <span className="px-3 py-1 text-xs font-mono bg-[#15243A] text-[#00E5FF] rounded-lg border border-[#23354D]">
                  Rating: {selectedBuilding.energyRating}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#8EA2BE] mt-4 leading-relaxed max-w-3xl">
              {selectedBuilding.description}
            </p>

            {/* Core Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="p-3 bg-[#0B1120] rounded-lg border border-[#23354D]/60">
                <div className="text-[11px] text-[#8EA2BE] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                  Height & Floors
                </div>
                <div className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#F3F7FF]">
                  {selectedBuilding.heightMeters} m
                </div>
                <div className="text-[11px] text-[#8EA2BE]">
                  {selectedBuilding.floors} Physical Stories
                </div>
              </div>

              <div className="p-3 bg-[#0B1120] rounded-lg border border-[#23354D]/60">
                <div className="text-[11px] text-[#8EA2BE] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#9B6DFF]" />
                  Active Power Draw
                </div>
                <div className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#F3F7FF]">
                  {selectedBuilding.energyUsageKwh.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#8EA2BE]">kWh Instantaneous</div>
              </div>

              <div className="p-3 bg-[#0B1120] rounded-lg border border-[#23354D]/60">
                <div className="text-[11px] text-[#8EA2BE] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#39D98A]" />
                  Occupancy Sensor
                </div>
                <div className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#F3F7FF]">
                  {selectedBuilding.occupancyEstimate}%
                </div>
                <div className="text-[11px] text-[#8EA2BE]">
                  ~{selectedBuilding.occupancyCount.toLocaleString()} occupants
                </div>
              </div>

              <div className="p-3 bg-[#0B1120] rounded-lg border border-[#23354D]/60">
                <div className="text-[11px] text-[#8EA2BE] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />
                  HVAC Efficiency
                </div>
                <div className="mt-1.5 text-lg font-bold font-mono tabular-nums text-[#39D98A]">
                  {selectedBuilding.hvacEfficiency}%
                </div>
                <div className="text-[11px] text-[#8EA2BE]">Smart filtration active</div>
              </div>
            </div>
          </div>

          {/* Subsystems & Energy Trend Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Building Energy Load Profile */}
            <div className="p-5 bg-[#10182A] border border-[#23354D] rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#F3F7FF]">
                    Facility 24-Hour Power Load Profile
                  </h3>
                  <p className="text-xs text-[#8EA2BE] mt-0.5">
                    Submeter consumption vs baseline building model
                  </p>
                </div>
              </div>
              <InteractiveChart
                data={ENERGY_TIME_SERIES['24h'].map((d) => ({
                  ...d,
                  value: Math.round(d.value * (selectedBuilding.energyUsageKwh / 1500)),
                  secondaryValue: Math.round(
                    (d.secondaryValue || 0) * (selectedBuilding.solarCapacityKw / 800)
                  ),
                }))}
                primaryLabel="Power Draw (kW)"
                secondaryLabel="Rooftop Solar (kW)"
                primaryUnit="kW"
                secondaryUnit="kW"
                primaryColor="#00E5FF"
                secondaryColor="#39D98A"
                height={200}
              />
            </div>

            {/* Maintenance History & Smart Infrastructure Systems */}
            <div className="p-5 bg-[#10182A] border border-[#23354D] rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#23354D] pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('telemetry')}
                    className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                      activeTab === 'telemetry'
                        ? 'text-[#00E5FF] border-[#00E5FF]'
                        : 'text-[#8EA2BE] border-transparent hover:text-white'
                    }`}
                  >
                    Engineering Systems
                  </button>
                  <button
                    onClick={() => setActiveTab('maintenance')}
                    className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                      activeTab === 'maintenance'
                        ? 'text-[#00E5FF] border-[#00E5FF]'
                        : 'text-[#8EA2BE] border-transparent hover:text-white'
                    }`}
                  >
                    Maintenance History ({selectedBuilding.maintenanceHistory.length})
                  </button>
                </div>
              </div>

              {activeTab === 'telemetry' ? (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-[#0B1120] rounded-lg border border-[#23354D]/60 flex items-center justify-between">
                    <div>
                      <span className="text-[#8EA2BE] block">Photovoltaic Generation Capacity</span>
                      <span className="font-semibold text-[#F3F7FF] font-mono">
                        {selectedBuilding.solarCapacityKw} kW Rooftop Solar Array
                      </span>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-[#39D98A]" />
                  </div>

                  <div className="p-3 bg-[#0B1120] rounded-lg border border-[#23354D]/60 flex items-center justify-between">
                    <div>
                      <span className="text-[#8EA2BE] block">Auxiliary Power Backup</span>
                      <span className="font-semibold text-[#F3F7FF] font-mono">
                        {selectedBuilding.backupPower}
                      </span>
                    </div>
                    <Zap className="w-5 h-5 text-[#9B6DFF]" />
                  </div>

                  <div className="p-3 bg-[#0B1120] rounded-lg border border-[#23354D]/60 flex items-center justify-between">
                    <div>
                      <span className="text-[#8EA2BE] block">Network & Data Uplink</span>
                      <span className="font-semibold text-[#F3F7FF] font-mono text-[11px]">
                        {selectedBuilding.networkStatus}
                      </span>
                    </div>
                    <Cpu className="w-5 h-5 text-[#00E5FF]" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {selectedBuilding.maintenanceHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#0B1120] rounded-lg border border-[#23354D]/60 space-y-1"
                    >
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-[#00E5FF]">{item.date}</span>
                        <span className="text-[#8EA2BE]">{item.technician}</span>
                      </div>
                      <div className="text-[#F3F7FF] font-medium">{item.action}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Standard Building Directory Grid & Filter View */
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#10182A] border border-[#23354D] rounded-xl">
              <span className="text-xs text-[#8EA2BE]">Total Registered Assets</span>
              <div className="mt-1 text-2xl font-bold font-mono text-[#F3F7FF]">
                {totalRegistered} Facilities
              </div>
              <div className="text-[11px] text-[#39D98A] mt-1 font-mono">
                {onlineCount} Online (100% Connectivity)
              </div>
            </div>

            <div className="p-4 bg-[#10182A] border border-[#23354D] rounded-xl">
              <span className="text-xs text-[#8EA2BE]">Preventative Risk Watchlist</span>
              <div className="mt-1 text-2xl font-bold font-mono text-[#FF5D73]">
                {highRiskCount} Buildings
              </div>
              <div className="text-[11px] text-[#8EA2BE] mt-1">
                Risk Index &gt; 60 (Requires Inspection)
              </div>
            </div>

            <div className="p-4 bg-[#10182A] border border-[#23354D] rounded-xl">
              <span className="text-xs text-[#8EA2BE]">Renewable Solar Installed</span>
              <div className="mt-1 text-2xl font-bold font-mono text-[#00E5FF]">
                18.4 MW
              </div>
              <div className="text-[11px] text-[#8EA2BE] mt-1">
                Distributed Rooftop PV Arrays
              </div>
            </div>
          </div>

          {/* Filter & Sorting Bar */}
          <div className="p-4 bg-[#10182A] border border-[#23354D] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-[#0B1120] border border-[#23354D] rounded-lg px-3 py-1.5 flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-[#00E5FF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search building name, sector, asset ID..."
                className="bg-transparent border-none text-[#F3F7FF] placeholder-[#8EA2BE] text-xs focus:outline-none flex-1"
              />
            </div>

            {/* Filter Selects & Sorting */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#0B1120] border border-[#23354D] text-[#F3F7FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                {buildingTypes.map((t) => (
                  <option key={t} value={t}>
                    {t === 'All' ? 'All Types' : t}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0B1120] border border-[#23354D] text-[#F3F7FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Nominal">Nominal</option>
                <option value="Optimizing">Optimizing</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Alert">Alert</option>
              </select>

              {/* District Filter */}
              <select
                value={selectedDistrict}
                onChange={(e) => onSelectDistrict(e.target.value as DistrictId)}
                className="bg-[#0B1120] border border-[#23354D] text-[#F3F7FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                <option value="all">All Sectors</option>
                {DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Sorting Control */}
              <div className="flex items-center gap-1 bg-[#0B1120] border border-[#23354D] rounded-lg px-2 py-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#00E5FF]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortField)}
                  className="bg-transparent border-none text-[#F3F7FF] text-xs focus:outline-none cursor-pointer"
                >
                  <option value="risk">Sort by Risk</option>
                  <option value="energy">Sort by Energy</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>
            </div>
          </div>

          {/* Building Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBuildings.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-[#10182A] border border-[#23354D] rounded-xl text-xs text-[#8EA2BE] space-y-2">
                <Building2 className="w-8 h-8 text-[#8EA2BE] mx-auto opacity-50" />
                <p className="text-sm text-[#F3F7FF] font-medium">No buildings found</p>
                <p>Try resetting the search terms or sector filters.</p>
              </div>
            ) : (
              filteredBuildings.map((building) => (
                <div
                  key={building.id}
                  onClick={() => setSelectedBuilding(building)}
                  className="p-5 rounded-xl bg-[#10182A] hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                        {building.type}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          building.status === 'Nominal'
                            ? 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/30'
                            : building.status === 'Alert'
                            ? 'bg-[#FF5D73]/20 text-[#FF5D73] border-[#FF5D73]/30'
                            : 'bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/30'
                        }`}
                      >
                        {building.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#F3F7FF] group-hover:text-[#00E5FF] transition-colors mt-2.5">
                      {building.name}
                    </h3>
                    <p className="text-xs text-[#8EA2BE] mt-0.5">
                      {building.districtName} Sector · {building.floors} Floors
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#23354D]/60 text-xs">
                      <div>
                        <span className="text-[#8EA2BE]">Energy Rating</span>
                        <div className="font-mono font-semibold text-[#F3F7FF]">
                          {building.energyRating} ({building.energyUsageKwh} kWh)
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8EA2BE]">Maint. Risk</span>
                        <div
                          className={`font-mono font-semibold ${
                            building.maintenanceRiskScore >= 75
                              ? 'text-[#FF5D73]'
                              : building.maintenanceRiskScore >= 60
                              ? 'text-[#FFB84D]'
                              : 'text-[#39D98A]'
                          }`}
                        >
                          {building.maintenanceRiskScore}/100
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#23354D]/60 flex items-center justify-between text-xs">
                    <span className="text-[#8EA2BE] font-mono text-[11px]">
                      {building.heightMeters}m height
                    </span>
                    <span className="text-[#00E5FF] font-medium group-hover:underline flex items-center gap-1">
                      Inspect Telemetry <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
