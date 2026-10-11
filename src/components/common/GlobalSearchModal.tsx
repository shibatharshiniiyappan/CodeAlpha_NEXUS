import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, AlertTriangle, Navigation, MapPin, ArrowRight } from 'lucide-react';
import { BUILDINGS, INITIAL_ALERTS, ROAD_SEGMENTS, DISTRICTS } from '../../data/mockData';
import { ScreenId } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenId, entityId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingBuildings = BUILDINGS.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.type.toLowerCase().includes(q) ||
      b.districtName.toLowerCase().includes(q)
  ).slice(0, 4);

  const matchingAlerts = INITIAL_ALERTS.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
  ).slice(0, 3);

  const matchingRoads = ROAD_SEGMENTS.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.districtName.toLowerCase().includes(q)
  ).slice(0, 3);

  const matchingDistricts = DISTRICTS.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.tagline.toLowerCase().includes(q)
  ).slice(0, 3);

  const totalResults =
    matchingBuildings.length +
    matchingAlerts.length +
    matchingRoads.length +
    matchingDistricts.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#101B2C] border border-[#23354D] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#23354D] bg-[#15243A]">
          <Search className="w-5 h-5 text-[#37D7FF]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buildings, alerts, transit corridors, districts... (Cmd+K)"
            className="flex-1 bg-transparent border-none text-[#F3F7FF] placeholder-[#8EA2BE] text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#8EA2BE] hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono text-[#8EA2BE] border border-[#23354D] rounded px-1.5 py-0.5">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {totalResults === 0 ? (
            <div className="py-8 text-center text-sm text-[#8EA2BE]">
              No urban entities matching &ldquo;{query}&rdquo;. Try &ldquo;Helix&rdquo;, &ldquo;Corridor&rdquo;, or &ldquo;Thermal&rdquo;.
            </div>
          ) : (
            <>
              {/* Buildings */}
              {matchingBuildings.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono text-[#8EA2BE] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#37D7FF]" />
                    Buildings & Infrastructure ({matchingBuildings.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingBuildings.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          onNavigate('buildings', b.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#0B1220]/70 hover:bg-[#15243A] border border-transparent hover:border-[#23354D] transition-all text-left group"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#F3F7FF] group-hover:text-[#37D7FF] transition-colors">
                            {b.name}
                          </div>
                          <div className="text-xs text-[#8EA2BE] flex items-center gap-2 mt-0.5">
                            <span>{b.type}</span>
                            <span>·</span>
                            <span>{b.districtName}</span>
                            <span>·</span>
                            <span className="font-mono tabular-nums">{b.heightMeters}m</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#8EA2BE] group-hover:text-[#37D7FF] group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alerts */}
              {matchingAlerts.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono text-[#8EA2BE] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FF5D73]" />
                    Operational Incidents ({matchingAlerts.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingAlerts.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          onNavigate('alerts', a.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#0B1220]/70 hover:bg-[#15243A] border border-transparent hover:border-[#23354D] transition-all text-left group"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#F3F7FF] group-hover:text-[#FF5D73] transition-colors flex items-center gap-2">
                            <span>{a.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FF5D73]/15 text-[#FF5D73]">
                              {a.severity}
                            </span>
                          </div>
                          <div className="text-xs text-[#8EA2BE] flex items-center gap-2 mt-0.5">
                            <span>{a.districtName}</span>
                            <span>·</span>
                            <span>{a.location}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#8EA2BE] group-hover:text-[#FF5D73] group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Roads */}
              {matchingRoads.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono text-[#8EA2BE] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#527BFF]" />
                    Mobility Corridors ({matchingRoads.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingRoads.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          onNavigate('mobility', r.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#0B1220]/70 hover:bg-[#15243A] border border-transparent hover:border-[#23354D] transition-all text-left group"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#F3F7FF] group-hover:text-[#527BFF] transition-colors">
                            {r.name}
                          </div>
                          <div className="text-xs text-[#8EA2BE] flex items-center gap-2 mt-0.5">
                            <span>{r.districtName}</span>
                            <span>·</span>
                            <span className="font-mono tabular-nums">{r.avgSpeedKmh} km/h avg</span>
                            <span>·</span>
                            <span>{r.congestionLevel} Congestion</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#8EA2BE] group-hover:text-[#527BFF] group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Districts */}
              {matchingDistricts.length > 0 && (
                <div>
                  <div className="text-[11px] font-mono text-[#8EA2BE] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#39D98A]" />
                    Districts ({matchingDistricts.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingDistricts.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          onNavigate('city-explorer', d.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#0B1220]/70 hover:bg-[#15243A] border border-transparent hover:border-[#23354D] transition-all text-left group"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#F3F7FF] group-hover:text-[#39D98A] transition-colors">
                            {d.name}
                          </div>
                          <div className="text-xs text-[#8EA2BE] mt-0.5">
                            {d.tagline}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#8EA2BE] group-hover:text-[#39D98A] group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-[#0B1220] border-t border-[#23354D] flex items-center justify-between text-[11px] text-[#8EA2BE]">
          <span>Press Enter to select</span>
          <span className="font-mono">Nexus Telemetry Core v2.4</span>
        </div>
      </div>
    </div>
  );
};
