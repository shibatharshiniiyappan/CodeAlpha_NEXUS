import React, { useState, useEffect } from 'react';
import { ScreenId, DistrictId, Alert, Building, AssistantContext } from './types';
import { getStoredAlerts, saveStoredAlerts, BUILDINGS, DISTRICTS } from './data/mockData';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { NexusAssistantDrawer } from './components/common/NexusAssistantDrawer';

// Cinematic 3D Animated Storytelling Landing Experience
import { CinematicStorytellingPage } from './components/screens/CinematicStorytellingPage';

// 8 Dedicated Full Working Screens
import { CommandCenter } from './components/screens/CommandCenter';
import { CityExplorer3D } from './components/screens/CityExplorer3D';
import { ScenarioSimulator } from './components/screens/ScenarioSimulator';
import { PredictiveRiskEngine } from './components/screens/PredictiveRiskEngine';
import { MobilityTraffic } from './components/screens/MobilityTraffic';
import { EnvironmentEnergy } from './components/screens/EnvironmentEnergy';
import { AlertsIncidents } from './components/screens/AlertsIncidents';
import { BuildingIntelligence } from './components/screens/BuildingIntelligence';

export default function App() {
  // Start on the cinematic 3D animated landing page
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('cinematic-landing');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Persistent alerts state
  const [alerts, setAlerts] = useState<Alert[]>(() => getStoredAlerts());

  const handleUpdateAlerts = (updated: Alert[]) => {
    setAlerts(updated);
    saveStoredAlerts(updated);
  };

  const handleNavigate = (screen: ScreenId, entityId?: string) => {
    setCurrentScreen(screen);
    setSelectedEntityId(entityId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset demo state
  const handleResetDemoData = () => {
    localStorage.removeItem('nexus_smart_city_alerts_state_v1');
    localStorage.removeItem('nexus_saved_scenarios_v2');
    window.location.reload();
  };

  // Keyboard shortcuts (Cmd+K for search, Cmd+J for assistant)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeAlertCount = alerts.filter((a) => a.status === 'Active').length;

  // Selected building & alert for assistant context
  const selectedBuilding: Building | null =
    BUILDINGS.find((b) => b.id === selectedEntityId) || null;
  const selectedAlert: Alert | null =
    alerts.find((a) => a.id === selectedEntityId) || null;
  const activeDistrictObj = DISTRICTS.find((d) => d.id === selectedDistrict);

  const assistantContext: AssistantContext = {
    currentScreen,
    selectedDistrict,
    districtName: activeDistrictObj ? activeDistrictObj.name : 'Metro Aggregate',
    selectedBuilding,
    selectedAlert,
    activeLayers: {
      traffic: true,
      energy: true,
      airQuality: true,
      buildingHealth: true,
      incidents: true,
    },
    activeRiskCount: 3,
  };

  // If on full-screen Cinematic 3D landing page, render dedicated cinematic layout
  if (currentScreen === 'cinematic-landing') {
    return (
      <div className="min-h-screen bg-[#070B16] text-[#F3F7FF] relative overflow-hidden">
        <CinematicStorytellingPage
          onEnterCommandCenter={() => handleNavigate('command-center')}
          onNavigateScreen={(screen, id) => handleNavigate(screen, id)}
          alerts={alerts}
        />

        {/* Global Search Modal */}
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={handleNavigate}
        />

        {/* NEXUS Context-Aware Assistant Slide-Over Drawer */}
        <NexusAssistantDrawer
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          context={assistantContext}
        />
      </div>
    );
  }

  // Otherwise, render full Command Center Dashboard Shell with all 8 operational suites
  return (
    <div className="min-h-screen bg-[#070B16] text-[#F3F7FF] flex">
      {/* Collapsible Navigation Sidebar & Mobile Drawer */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => handleNavigate(screen)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        activeAlertCount={activeAlertCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onResetDemoData={handleResetDemoData}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Sticky Top Bar */}
        <TopBar
          currentScreen={currentScreen}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          alerts={alerts}
          onNavigate={handleNavigate}
        />

        {/* Viewport Content Container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {currentScreen === 'command-center' && (
            <CommandCenter
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
              onNavigate={handleNavigate}
              alerts={alerts}
            />
          )}

          {currentScreen === 'city-explorer' && (
            <CityExplorer3D
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
              onNavigate={handleNavigate}
              initialBuildingId={selectedEntityId}
              alerts={alerts}
            />
          )}

          {currentScreen === 'scenario-simulator' && (
            <ScenarioSimulator />
          )}

          {currentScreen === 'predictive-risk' && (
            <PredictiveRiskEngine onNavigate={handleNavigate} />
          )}

          {currentScreen === 'mobility' && (
            <MobilityTraffic
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
              initialRoadId={selectedEntityId}
            />
          )}

          {currentScreen === 'environment' && (
            <EnvironmentEnergy
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
            />
          )}

          {currentScreen === 'alerts' && (
            <AlertsIncidents
              alerts={alerts}
              onUpdateAlerts={handleUpdateAlerts}
              initialAlertId={selectedEntityId}
            />
          )}

          {currentScreen === 'buildings' && (
            <BuildingIntelligence
              selectedDistrict={selectedDistrict}
              onSelectDistrict={setSelectedDistrict}
              onNavigate={handleNavigate}
              initialBuildingId={selectedEntityId}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-[#23354D] bg-[#0B1120]/60 text-xs text-[#8EA2BE] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-[#F3F7FF]">NEXUS</span>
            <span>·</span>
            <span>Smart City Intelligence Platform</span>
            <span>·</span>
            <span className="italic">&ldquo;See the city. Predict the risks. Simulate the future.&rdquo;</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-[#39D98A]">● TELEMETRY STREAM ONLINE</span>
            <span className="text-[#8EA2BE]">DECISION SUPPORT ENGINE v2.5</span>
          </div>
        </footer>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* NEXUS Context-Aware Assistant Slide-Over Drawer */}
      <NexusAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        context={assistantContext}
      />
    </div>
  );
}
