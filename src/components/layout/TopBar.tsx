import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Clock,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { DistrictId, ScreenId, Alert } from '../../types';
import { DISTRICTS } from '../../data/mockData';

import directorAvatarPath from '../../assets/images/avatar_director_1791726349769.jpg';

interface TopBarProps {
  currentScreen: ScreenId;
  selectedDistrict: DistrictId;
  onSelectDistrict: (districtId: DistrictId) => void;
  onOpenSearch: () => void;
  onOpenMobileMenu: () => void;
  onOpenAssistant: () => void;
  alerts: Alert[];
  onNavigate: (screen: ScreenId, entityId?: string) => void;
}

const SCREEN_TITLES: Record<ScreenId, { title: string; subtitle: string }> = {
  'cinematic-landing': {
    title: 'NEXUS Cinematic 3D Journey',
    subtitle: 'Interactive Multi-Section Storytelling & Spatial Digital Twin',
  },
  'command-center': {
    title: 'NEXUS City Operations Center',
    subtitle: 'Holistic Municipal Telemetry, Digital Twin & Operations Control',
  },
  'city-explorer': {
    title: 'Live 3D Digital Twin',
    subtitle: 'Real-Time Spatial Simulation, Conduit Flow & Layer Telemetry',
  },
  'scenario-simulator': {
    title: 'Scenario Simulator',
    subtitle: 'Urban Policy Experimentation, Trade-Off Modeling & Projections',
  },
  'predictive-risk': {
    title: 'Predictive Risk Engine',
    subtitle: 'Multi-Horizon Early Warning, Vulnerability Scores & Mitigations',
  },
  'mobility': {
    title: 'Mobility & Traffic',
    subtitle: 'Corridor Velocities, Congestion Hotspots & Adaptive Signal Priority',
  },
  'environment': {
    title: 'Environment & Energy',
    subtitle: 'Atmospheric AQI, Carbon Offsets & Microgrid Telemetry',
  },
  'alerts': {
    title: 'Alerts & Incidents',
    subtitle: 'Operational Incident Response, Dispatch Log & System Audits',
  },
  'buildings': {
    title: 'Building Intelligence',
    subtitle: 'Facilities Directory, Energy Ratings & Preventative Maintenance Risk',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentScreen,
  selectedDistrict,
  onSelectDistrict,
  onOpenSearch,
  onOpenMobileMenu,
  onOpenAssistant,
  alerts,
  onNavigate,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('07:15:00 AM');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Live ticking clock with simulated time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeAlerts = alerts.filter((a) => a.status === 'Active');
  const screenMeta = SCREEN_TITLES[currentScreen] || {
    title: 'NEXUS Command',
    subtitle: 'Smart City Intelligence',
  };

  return (
    <header className="h-16 bg-[#0B1120]/90 backdrop-blur-md border-b border-[#23354D] sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      {/* Left: Mobile hamburger & Screen Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#15243A] rounded-lg transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm lg:text-base font-semibold text-[#F3F7FF] whitespace-nowrap">
              {screenMeta.title}
            </h1>
            <span className="hidden sm:inline-block text-[#8EA2BE] text-xs">/</span>
            <span className="hidden sm:inline-block text-xs text-[#00E5FF] font-mono">
              NEXUS-TWIN
            </span>
            <div className="hidden lg:flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-[#15243A]/80 border border-[#23354D] text-[10px] font-mono text-[#39D98A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39D98A] animate-pulse" />
              <span>CITY STATUS: OPTIMAL</span>
            </div>
          </div>
          <p className="hidden md:block text-[11px] text-[#8EA2BE] truncate max-w-xs lg:max-w-md">
            {screenMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* District Selector */}
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={(e) => onSelectDistrict(e.target.value as DistrictId)}
            className="appearance-none bg-[#10182A] border border-[#23354D] text-[#F3F7FF] text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-[#00E5FF] cursor-pointer hover:bg-[#15243A] transition-colors"
          >
            <option value="all">All City Districts</option>
            {DISTRICTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#8EA2BE] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#10182A] hover:bg-[#15243A] border border-[#23354D] rounded-lg text-xs text-[#8EA2BE] hover:text-[#F3F7FF] transition-colors group"
        >
          <Search className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span className="hidden md:inline">Quick Search...</span>
          <kbd className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 bg-[#070B16] border border-[#23354D] rounded text-[#8EA2BE]">
            ⌘K
          </kbd>
        </button>

        {/* Cinematic 3D Journey Trigger Button */}
        <button
          onClick={() => onNavigate('cinematic-landing')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#00E5FF]/15 via-[#4D7CFE]/15 to-[#9B6DFF]/15 hover:from-[#00E5FF]/25 hover:to-[#9B6DFF]/25 border border-[#00E5FF]/40 text-[#00E5FF] rounded-lg text-xs font-semibold transition-all shadow-sm"
          title="Experience Cinematic 3D Storytelling"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span className="hidden md:inline">3D Story</span>
        </button>

        {/* AI Assistant Quick Trigger Button */}
        <button
          onClick={onOpenAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10182A] hover:bg-[#15243A] border border-[#00E5FF]/40 text-[#00E5FF] rounded-lg text-xs font-semibold transition-colors shadow-sm"
          title="Open NEXUS Context-Aware Assistant"
        >
          <Bot className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span className="hidden sm:inline">Assistant</span>
        </button>

        {/* Simulated Time Box */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-[#10182A] border border-[#23354D] rounded-lg">
          <Clock className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span className="text-xs font-mono tabular-nums text-[#F3F7FF]">
            {currentTime}
          </span>
          <span className="text-[10px] font-mono text-[#39D98A] uppercase">
            SIM-LIVE
          </span>
        </div>

        {/* Notifications Control */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#15243A] rounded-lg transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5D73] ring-2 ring-[#0B1120]" />
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#10182A] border border-[#23354D] rounded-xl shadow-2xl p-4 z-50 animate-in fade-in duration-150"
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#23354D]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#F3F7FF]">
                    Active City Incidents
                  </span>
                  <span className="text-[10px] font-mono bg-[#FF5D73]/15 text-[#FF5D73] px-1.5 py-0.5 rounded">
                    {activeAlerts.length} Active
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('alerts');
                  }}
                  className="text-[11px] text-[#00E5FF] hover:underline flex items-center gap-1"
                >
                  View All <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                {activeAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('alerts', alert.id);
                    }}
                    className="p-2.5 rounded-lg bg-[#070B16] hover:bg-[#15243A] border border-transparent hover:border-[#23354D] cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-[#F3F7FF] line-clamp-1">
                        {alert.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                          alert.severity === 'Critical'
                            ? 'bg-[#FF5D73]/20 text-[#FF5D73]'
                            : 'bg-[#FFB84D]/20 text-[#FFB84D]'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8EA2BE] mt-1 flex items-center justify-between">
                      <span>{alert.districtName}</span>
                      <span className="font-mono text-[10px]">{alert.timestamp.split('(')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1 pl-2 bg-[#10182A] hover:bg-[#15243A] border border-[#23354D] rounded-lg transition-colors group"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-[#F3F7FF] group-hover:text-[#00E5FF] transition-colors">
                Dr. Marcus Vance
              </div>
              <div className="text-[10px] text-[#8EA2BE] font-mono">
                Operations Director
              </div>
            </div>
            <img
              src={directorAvatarPath}
              alt="Operations Director Portrait"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-md object-cover border border-[#00E5FF]/30"
            />
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div
              className="absolute right-0 mt-2 w-64 bg-[#10182A] border border-[#23354D] rounded-xl shadow-2xl p-4 z-50 animate-in fade-in duration-150"
              onMouseLeave={() => setShowProfile(false)}
            >
              <div className="flex items-center gap-3 pb-3 border-b border-[#23354D]">
                <img
                  src={directorAvatarPath}
                  alt="Operations Director"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-md object-cover border border-[#00E5FF]/40"
                />
                <div>
                  <div className="text-xs font-bold text-[#F3F7FF]">
                    Dr. Marcus Vance
                  </div>
                  <div className="text-[11px] text-[#00E5FF]">
                    Chief Operations Director
                  </div>
                  <div className="text-[10px] text-[#8EA2BE] font-mono">
                    Clearance: LEVEL-5 (CITY COMMAND)
                  </div>
                </div>
              </div>

              <div className="py-3 space-y-1.5 text-xs text-[#8EA2BE]">
                <div className="flex justify-between">
                  <span>Duty Station</span>
                  <span className="text-[#F3F7FF] font-medium">Command Deck CF-01</span>
                </div>
                <div className="flex justify-between">
                  <span>Session Runtime</span>
                  <span className="text-[#F3F7FF] font-mono">04h 28m</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Engine</span>
                  <span className="text-[#39D98A] font-mono">NEXUS Core v2.5</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#23354D]">
                <div className="text-[10px] text-[#8EA2BE] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                  <span>Decision Support Prototype Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
