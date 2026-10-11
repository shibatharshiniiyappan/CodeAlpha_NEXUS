import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  Sliders,
  ShieldAlert,
  Navigation,
  Zap,
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Bot,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ScreenId } from '../../types';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeAlertCount: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenAssistant: () => void;
  onResetDemoData: () => void;
}

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  hotkey?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  activeAlertCount,
  isMobileOpen,
  onCloseMobile,
  onOpenAssistant,
  onResetDemoData,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const navItems: NavItem[] = [
    { id: 'cinematic-landing', label: 'Cinematic 3D Story', icon: Sparkles, hotkey: '0' },
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard, hotkey: '1' },
    { id: 'city-explorer', label: 'Live 3D Digital Twin', icon: Box, hotkey: '2' },
    { id: 'scenario-simulator', label: 'Scenario Simulator', icon: Sliders, hotkey: '3' },
    { id: 'predictive-risk', label: 'Predictive Risk Engine', icon: ShieldAlert, hotkey: '4' },
    { id: 'mobility', label: 'Mobility & Traffic', icon: Navigation, hotkey: '5' },
    { id: 'environment', label: 'Environment & Energy', icon: Zap, hotkey: '6' },
    { id: 'alerts', label: 'Alerts & Incidents', icon: AlertTriangle, badge: activeAlertCount, hotkey: '7' },
    { id: 'buildings', label: 'Building Intelligence', icon: Building2, hotkey: '8' },
  ];

  const handleNavClick = (id: ScreenId) => {
    onNavigate(id);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
              onCloseMobile();
            }
          }}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden cursor-pointer"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#0B1120] border-r border-[#23354D] transition-all duration-300 ease-in-out shadow-2xl ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen
            ? 'translate-x-0 w-72'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-[#23354D] bg-[#070B16]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00E5FF] via-[#4D7CFE] to-[#9B6DFF] p-[1px] shrink-0 flex items-center justify-center shadow-lg shadow-[#00E5FF]/10">
              <div className="w-full h-full bg-[#070B16] rounded-[7px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#00E5FF]" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-wider text-[#F3F7FF] font-mono">
                    NEXUS
                  </span>
                  <span className="text-[9px] font-mono tracking-widest text-[#00E5FF] px-1 py-0.2 bg-[#00E5FF]/10 rounded border border-[#00E5FF]/30">
                    AI-TWIN
                  </span>
                </div>
                <div className="text-[10px] text-[#8EA2BE] tracking-tight truncate">
                  SMART CITY INTELLIGENCE
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar into rail'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse into compact rail'}
            className="hidden md:flex p-1.5 text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#15243A] rounded-md transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Tagline callout when expanded */}
        {!isCollapsed && (
          <div className="px-4 py-2 bg-[#10182A]/70 border-b border-[#23354D]/60 text-[11px] text-[#8EA2BE] italic">
            &ldquo;See the city. Predict risks. Simulate future.&rdquo;
          </div>
        )}

        {/* Navigation Items (8 Full Working Screens) */}
        <nav className="flex-1 py-3 px-2.5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-[#15243A] text-[#00E5FF] border border-[#00E5FF]/40 shadow-sm shadow-[#00E5FF]/10 ring-1 ring-[#00E5FF]/20'
                      : 'text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#10182A]'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#00E5FF]' : 'text-[#8EA2BE] group-hover:text-[#F3F7FF]'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`font-mono tabular-nums text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-[#FF5D73] text-white'
                          : 'bg-[#FF5D73]/20 text-[#FF5D73]'
                      } ${isCollapsed ? 'absolute -top-1 -right-1 px-1.5' : ''}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Rail Mode */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 pointer-events-none hidden md:group-hover:flex items-center z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-[#10182A] text-[#F3F7FF] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#23354D] shadow-2xl whitespace-nowrap flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-mono bg-[#FF5D73] text-white px-1.5 py-0.2 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Assistant Dedicated Trigger in Sidebar */}
          <div className="pt-2 border-t border-[#23354D]/70 relative group">
            <button
              onClick={onOpenAssistant}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#00E5FF]/15 via-[#4D7CFE]/15 to-[#9B6DFF]/15 text-[#00E5FF] border border-[#00E5FF]/30 hover:border-[#00E5FF]/70 transition-all shadow-sm ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Open NEXUS AI Assistant (Cmd+J)"
            >
              <Bot className="w-4 h-4 text-[#00E5FF] shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 text-left flex items-center justify-between">
                  <span>NEXUS Assistant</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-[#00E5FF]/20 text-[#00E5FF] rounded">
                    AI
                  </span>
                </div>
              )}
            </button>

            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 pointer-events-none hidden md:group-hover:flex items-center z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="bg-[#10182A] text-[#00E5FF] text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#00E5FF]/40 shadow-2xl whitespace-nowrap">
                  NEXUS Assistant (Cmd+J)
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* System Simulation Footer & Reset Control */}
        <div className="p-3 border-t border-[#23354D] bg-[#070B16]">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#8EA2BE]">
                <span>Telemetry Status</span>
                <span className="font-mono text-[#39D98A]">100% ONLINE</span>
              </div>

              {/* Reset Demo Data Action */}
              {showResetConfirm ? (
                <div className="p-2 bg-[#15243A] rounded border border-[#FF5D73]/40 text-xs space-y-1.5 animate-in fade-in">
                  <span className="text-[11px] text-[#FF5D73] block">
                    Reset all scenario & alert overrides?
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onResetDemoData();
                        setShowResetConfirm(false);
                      }}
                      className="flex-1 py-1 bg-[#FF5D73] text-white text-[10px] font-bold rounded"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-1 bg-[#10182A] text-[#8EA2BE] text-[10px] rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#10182A] py-1 rounded transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Demo State</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-center" title="Reset Demo State">
              <button
                onClick={onResetDemoData}
                className="text-[#8EA2BE] hover:text-[#00E5FF] p-2 rounded-lg hover:bg-[#15243A] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
