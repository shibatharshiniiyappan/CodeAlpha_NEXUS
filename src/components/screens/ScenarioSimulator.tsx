import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Save,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Bookmark,
  Layers,
  ArrowRight,
  Info,
  BarChart3,
  Scale,
} from 'lucide-react';
import { ScenarioPolicy, ScenarioImpactMetrics, SavedScenario } from '../../types';
import {
  BASELINE_POLICY,
  BASELINE_METRICS,
  calculateScenarioProjections,
  getStoredScenarios,
  saveStoredScenarios,
} from '../../utils/scenarioCalculations';
import { InteractiveChart } from '../common/ChartWrapper';

export const ScenarioSimulator: React.FC = () => {
  const [policy, setPolicy] = useState<ScenarioPolicy>(BASELINE_POLICY);
  const [activeResults, setActiveResults] = useState<ScenarioImpactMetrics>(() =>
    calculateScenarioProjections(BASELINE_POLICY)
  );
  const [scenarioName, setScenarioName] = useState<string>('Custom Policy Experiment 01');
  const [scenarioNotes, setScenarioNotes] = useState<string>('');
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() =>
    getStoredScenarios()
  );
  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Run simulation
  const handleRunSimulation = () => {
    const results = calculateScenarioProjections(policy);
    setActiveResults(results);
    setFeedbackMsg('Simulation executed: Projected outcomes computed successfully.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Reset to Baseline
  const handleResetToBaseline = () => {
    setPolicy(BASELINE_POLICY);
    const results = calculateScenarioProjections(BASELINE_POLICY);
    setActiveResults(results);
    setScenarioName('Custom Policy Experiment 01');
    setFeedbackMsg('Policy sliders reset to municipal baseline.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Save Scenario
  const handleSaveScenario = () => {
    if (!scenarioName.trim()) return;
    const newScen: SavedScenario = {
      id: `scen-${Date.now()}`,
      name: scenarioName.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      policy: { ...policy },
      results: { ...activeResults },
      notes: scenarioNotes.trim() || undefined,
    };
    const updated = [newScen, ...savedScenarios];
    setSavedScenarios(updated);
    saveStoredScenarios(updated);
    setFeedbackMsg(`Scenario "${newScen.name}" saved to local library.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Delete saved scenario
  const handleDeleteScenario = (id: string) => {
    const updated = savedScenarios.filter((s) => s.id !== id);
    setSavedScenarios(updated);
    saveStoredScenarios(updated);
    if (selectedComparisonId === id) setSelectedComparisonId(null);
  };

  // Load a saved scenario into active editor
  const handleLoadScenario = (scen: SavedScenario) => {
    setPolicy(scen.policy);
    setActiveResults(scen.results);
    setScenarioName(scen.name);
    setScenarioNotes(scen.notes || '');
    setFeedbackMsg(`Loaded scenario: "${scen.name}"`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Calculate delta helper
  const getDelta = (baseline: number, projected: number, lowerIsBetter = false) => {
    const diff = projected - baseline;
    const pct = baseline !== 0 ? Math.round((diff / baseline) * 1000) / 10 : 0;
    const isBeneficial = lowerIsBetter ? diff < 0 : diff > 0;
    return {
      diff: Math.round(diff * 10) / 10,
      pct,
      isBeneficial,
      sign: diff > 0 ? '+' : '',
    };
  };

  const deltaCongestion = getDelta(BASELINE_METRICS.trafficCongestionIndex, activeResults.trafficCongestionIndex, true);
  const deltaSpeed = getDelta(BASELINE_METRICS.avgSpeedKmh, activeResults.avgSpeedKmh, false);
  const deltaAqi = getDelta(BASELINE_METRICS.airQualityIndex, activeResults.airQualityIndex, true);
  const deltaEnergy = getDelta(BASELINE_METRICS.energyDemandMW, activeResults.energyDemandMW, true);
  const deltaRenewable = getDelta(BASELINE_METRICS.renewableSharePct, activeResults.renewableSharePct, false);
  const deltaConvenience = getDelta(BASELINE_METRICS.travelConvenienceIndex, activeResults.travelConvenienceIndex, false);

  // Comparison scenario if selected
  const comparisonScenario = savedScenarios.find((s) => s.id === selectedComparisonId);

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="p-3 bg-[#39D98A]/15 border border-[#39D98A]/40 text-[#39D98A] rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackMsg}</span>
          </div>
          <span className="font-mono text-[10px]">SCENARIO ENGINE</span>
        </div>
      )}

      {/* Header & Disclaimer */}
      <div className="p-4 bg-[#101B2C] border border-[#23354D] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <h2 className="text-base font-semibold text-[#F3F7FF] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#37D7FF]" />
            NEXUS Scenario Simulator · Policy Experimentation Lab
          </h2>
          <p className="text-[#8EA2BE] mt-0.5">
            Test policy levers, analyze non-linear municipal trade-offs, and compare projected urban trajectories.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#FFB84D] bg-[#15243A] px-2.5 py-1 rounded border border-[#23354D]">
          <Info className="w-3.5 h-3.5" />
          <span>SIMULATED PROJECTION · DECISION SUPPORT PROTOTYPE</span>
        </div>
      </div>

      {/* Controls & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Policy Levers & Actions (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-[#101B2C] border border-[#23354D] rounded-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#23354D] pb-3">
            <span className="text-sm font-semibold text-[#F3F7FF] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#37D7FF]" /> Policy Levers
            </span>
            <span className="text-[11px] font-mono text-[#8EA2BE]">INDEX: 0 – 100</span>
          </div>

          {/* Scenario Name & Notes */}
          <div className="space-y-2">
            <label className="text-xs text-[#8EA2BE] font-medium block">
              Scenario Name
            </label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g. Clean Energy Transition 2030"
              className="w-full bg-[#0B1220] border border-[#23354D] rounded-lg px-3 py-2 text-xs text-[#F3F7FF] focus:outline-none focus:border-[#37D7FF]"
            />
          </div>

          {/* Slider 1: Public Transit Investment */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#F3F7FF] font-medium">Public Transit Investment</span>
              <span className="font-mono text-[#37D7FF] font-bold">{policy.transitInvestment}/100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={policy.transitInvestment}
              onChange={(e) =>
                setPolicy({ ...policy, transitInvestment: Number(e.target.value) })
              }
              className="w-full accent-[#37D7FF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8EA2BE]">
              <span>Minimal service</span>
              <span>Baseline: 45</span>
              <span>Ultra autonomous rail</span>
            </div>
          </div>

          {/* Slider 2: Traffic Restriction Intensity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#F3F7FF] font-medium">Traffic Restriction Intensity</span>
              <span className="font-mono text-[#FFB84D] font-bold">{policy.trafficRestrictions}/100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={policy.trafficRestrictions}
              onChange={(e) =>
                setPolicy({ ...policy, trafficRestrictions: Number(e.target.value) })
              }
              className="w-full accent-[#FFB84D] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8EA2BE]">
              <span>Unrestricted</span>
              <span>Baseline: 30</span>
              <span>Zero private vehicles</span>
            </div>
          </div>

          {/* Slider 3: Renewable Energy Adoption */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#F3F7FF] font-medium">Renewable Energy Adoption</span>
              <span className="font-mono text-[#39D98A] font-bold">{policy.renewableAdoption}/100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={policy.renewableAdoption}
              onChange={(e) =>
                setPolicy({ ...policy, renewableAdoption: Number(e.target.value) })
              }
              className="w-full accent-[#39D98A] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8EA2BE]">
              <span>Conventional grid</span>
              <span>Baseline: 50</span>
              <span>100% solar & tidal</span>
            </div>
          </div>

          {/* Slider 4: Building Energy Efficiency */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#F3F7FF] font-medium">Building Energy Efficiency</span>
              <span className="font-mono text-[#9B7BFF] font-bold">{policy.buildingEfficiency}/100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={policy.buildingEfficiency}
              onChange={(e) =>
                setPolicy({ ...policy, buildingEfficiency: Number(e.target.value) })
              }
              className="w-full accent-[#9B7BFF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8EA2BE]">
              <span>Standard codes</span>
              <span>Baseline: 40</span>
              <span>Passive net-zero retrofit</span>
            </div>
          </div>

          {/* Slider 5: Green Space Investment */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#F3F7FF] font-medium">Green-Space & Urban Canopy</span>
              <span className="font-mono text-[#37D7FF] font-bold">{policy.greenSpaceInvestment}/100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={policy.greenSpaceInvestment}
              onChange={(e) =>
                setPolicy({ ...policy, greenSpaceInvestment: Number(e.target.value) })
              }
              className="w-full accent-[#37D7FF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#8EA2BE]">
              <span>Existing canopy</span>
              <span>Baseline: 35</span>
              <span>Dense biophilic lungs</span>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] text-[#8EA2BE] block">
              Policy Rationale & Observations:
            </label>
            <textarea
              rows={2}
              value={scenarioNotes}
              onChange={(e) => setScenarioNotes(e.target.value)}
              placeholder="e.g. Focus on reducing core congestion while mitigating commuter disruption..."
              className="w-full bg-[#0B1220] border border-[#23354D] rounded-lg p-2 text-xs text-[#F3F7FF] focus:outline-none focus:border-[#37D7FF]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[#23354D] flex flex-wrap gap-2">
            <button
              onClick={handleRunSimulation}
              className="flex-1 py-2.5 px-3 bg-[#37D7FF] hover:bg-[#28bade] text-[#070B14] font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#37D7FF]/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Simulation
            </button>

            <button
              onClick={handleSaveScenario}
              className="py-2.5 px-3 bg-[#15243A] hover:bg-[#1f3656] text-[#37D7FF] border border-[#23354D] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              Save Scenario
            </button>

            <button
              onClick={handleResetToBaseline}
              title="Reset to baseline parameters"
              className="p-2.5 bg-[#0B1220] hover:bg-[#15243A] text-[#8EA2BE] hover:text-[#F3F7FF] border border-[#23354D] rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Projected Impact Outcomes & Trade-offs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Impact Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Metric 1: Traffic Congestion */}
            <div className="p-3.5 bg-[#101B2C] border border-[#23354D] rounded-xl">
              <span className="text-[11px] text-[#8EA2BE]">Traffic Congestion</span>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#F3F7FF]">
                {activeResults.trafficCongestionIndex}%
              </div>
              <div
                className={`mt-1 text-[11px] font-mono flex items-center gap-1 ${
                  deltaCongestion.isBeneficial ? 'text-[#39D98A]' : 'text-[#FF5D73]'
                }`}
              >
                {deltaCongestion.diff < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                <span>
                  {deltaCongestion.sign}{deltaCongestion.diff}% ({deltaCongestion.sign}{deltaCongestion.pct}%)
                </span>
              </div>
              <div className="text-[10px] text-[#8EA2BE] mt-0.5">
                Baseline: {BASELINE_METRICS.trafficCongestionIndex}%
              </div>
            </div>

            {/* Metric 2: Air Quality Index */}
            <div className="p-3.5 bg-[#101B2C] border border-[#23354D] rounded-xl">
              <span className="text-[11px] text-[#8EA2BE]">Air Quality (AQI)</span>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#39D98A]">
                {activeResults.airQualityIndex} AQI
              </div>
              <div
                className={`mt-1 text-[11px] font-mono flex items-center gap-1 ${
                  deltaAqi.isBeneficial ? 'text-[#39D98A]' : 'text-[#FF5D73]'
                }`}
              >
                {deltaAqi.diff < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                <span>
                  {deltaAqi.sign}{deltaAqi.diff} ({deltaAqi.sign}{deltaAqi.pct}%)
                </span>
              </div>
              <div className="text-[10px] text-[#8EA2BE] mt-0.5">
                PM2.5: {activeResults.pm25UgM3} µg/m³
              </div>
            </div>

            {/* Metric 3: Renewable Share */}
            <div className="p-3.5 bg-[#101B2C] border border-[#23354D] rounded-xl">
              <span className="text-[11px] text-[#8EA2BE]">Renewable Share</span>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#37D7FF]">
                {activeResults.renewableSharePct}%
              </div>
              <div
                className={`mt-1 text-[11px] font-mono flex items-center gap-1 ${
                  deltaRenewable.isBeneficial ? 'text-[#39D98A]' : 'text-[#FF5D73]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {deltaRenewable.sign}{deltaRenewable.diff}% ({deltaRenewable.sign}{deltaRenewable.pct}%)
                </span>
              </div>
              <div className="text-[10px] text-[#8EA2BE] mt-0.5">
                Cap asymptote: 98.5%
              </div>
            </div>

            {/* Metric 4: Grid Energy Demand */}
            <div className="p-3.5 bg-[#101B2C] border border-[#23354D] rounded-xl">
              <span className="text-[11px] text-[#8EA2BE]">Grid Power Demand</span>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#F3F7FF]">
                {activeResults.energyDemandMW} MW
              </div>
              <div
                className={`mt-1 text-[11px] font-mono flex items-center gap-1 ${
                  deltaEnergy.isBeneficial ? 'text-[#39D98A]' : 'text-[#FF5D73]'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>
                  {deltaEnergy.sign}{deltaEnergy.diff} MW ({deltaEnergy.sign}{deltaEnergy.pct}%)
                </span>
              </div>
              <div className="text-[10px] text-[#8EA2BE] mt-0.5">
                Baseline: {BASELINE_METRICS.energyDemandMW} MW
              </div>
            </div>

            {/* Metric 5: Travel Convenience (Trade-off) */}
            <div className="p-3.5 bg-[#101B2C] border border-[#23354D] rounded-xl">
              <span className="text-[11px] text-[#8EA2BE]">Travel Convenience</span>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#FFB84D]">
                {activeResults.travelConvenienceIndex}%
              </div>
              <div
                className={`mt-1 text-[11px] font-mono flex items-center gap-1 ${
                  deltaConvenience.isBeneficial ? 'text-[#39D98A]' : 'text-[#FF5D73]'
                }`}
              >
                {deltaConvenience.diff > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {deltaConvenience.sign}{deltaConvenience.diff}% ({deltaConvenience.sign}{deltaConvenience.pct}%)
                </span>
              </div>
              <div className="text-[10px] text-[#8EA2BE] mt-0.5">
                Trade-off factor
              </div>
            </div>

            {/* Metric 6: Daily Carbon Emissions */}
            <div className="p-3.5 bg-[#101B2C] border border-[#23354D] rounded-xl">
              <span className="text-[11px] text-[#8EA2BE]">Carbon Footprint</span>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#F3F7FF]">
                {activeResults.carbonEmissionsTonnes.toLocaleString()} t
              </div>
              <div className="mt-1 text-[11px] font-mono text-[#39D98A] flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>
                  {Math.round(activeResults.carbonEmissionsTonnes - BASELINE_METRICS.carbonEmissionsTonnes)} t/day
                </span>
              </div>
              <div className="text-[10px] text-[#8EA2BE] mt-0.5">
                Baseline: {BASELINE_METRICS.carbonEmissionsTonnes.toLocaleString()} t
              </div>
            </div>
          </div>

          {/* Multi-Dimensional Trade-Offs & Assumptions Panel */}
          <div className="p-4 bg-[#15243A] border border-[#23354D] rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#37D7FF]">
              <Info className="w-4 h-4" /> Modeled Trade-offs & Assumptions
            </div>
            <p className="text-[#8EA2BE] leading-relaxed">
              • <strong className="text-[#F3F7FF]">Diminishing Returns:</strong> Renewable penetration above 80% requires escalating battery storage costs and reserves.
            </p>
            <p className="text-[#8EA2BE] leading-relaxed">
              • <strong className="text-[#F3F7FF]">Citizen Inconvenience:</strong> Heavy traffic restrictions (&gt;40 index) reduce private vehicle road congestion, but heavily restrict freight delivery and personal mobility without equivalent transit expansion.
            </p>
            <p className="text-[#8EA2BE] leading-relaxed">
              • <strong className="text-[#F3F7FF]">Non-Linear AQI Coupling:</strong> Urban canopy expansion works synergistically with electric mobility, producing compounding reductions in particulate matter PM2.5.
            </p>
          </div>
        </div>
      </div>

      {/* Saved Scenario Library & Comparison Matrix */}
      <div className="p-5 bg-[#101B2C] border border-[#23354D] rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#F3F7FF] flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#37D7FF]" />
              Saved Scenario Benchmark Matrix ({savedScenarios.length})
            </h3>
            <p className="text-xs text-[#8EA2BE]">
              Compare saved urban policy packages side-by-side against baseline city performance
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-lg border border-[#23354D]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B1220] text-[#8EA2BE] uppercase font-mono text-[10px] border-b border-[#23354D]">
              <tr>
                <th className="py-2.5 px-3">Scenario Name</th>
                <th className="py-2.5 px-3 text-right">Congestion</th>
                <th className="py-2.5 px-3 text-right">Speed</th>
                <th className="py-2.5 px-3 text-right">AQI</th>
                <th className="py-2.5 px-3 text-right">Energy Demand</th>
                <th className="py-2.5 px-3 text-right">Renewable %</th>
                <th className="py-2.5 px-3 text-right">Convenience</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#23354D]/60 bg-[#101B2C]">
              {/* Baseline Row */}
              <tr className="bg-[#15243A]/40 font-medium">
                <td className="py-2.5 px-3 text-[#37D7FF] font-semibold">
                  MUNICIPAL BASELINE (CURRENT)
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                  {BASELINE_METRICS.trafficCongestionIndex}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                  {BASELINE_METRICS.avgSpeedKmh} km/h
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                  {BASELINE_METRICS.airQualityIndex} AQI
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                  {BASELINE_METRICS.energyDemandMW} MW
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                  {BASELINE_METRICS.renewableSharePct}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                  {BASELINE_METRICS.travelConvenienceIndex}%
                </td>
                <td className="py-2.5 px-3 text-right text-[11px] text-[#8EA2BE]">
                  Standard Datum
                </td>
              </tr>

              {/* Active Current Simulation */}
              <tr className="bg-[#15243A]/80 border-y border-[#37D7FF]/30">
                <td className="py-2.5 px-3 text-[#F3F7FF] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#37D7FF]" />
                  Active Workspace: {scenarioName}
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#F3F7FF]">
                  {activeResults.trafficCongestionIndex}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#F3F7FF]">
                  {activeResults.avgSpeedKmh} km/h
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#39D98A]">
                  {activeResults.airQualityIndex} AQI
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#F3F7FF]">
                  {activeResults.energyDemandMW} MW
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#37D7FF]">
                  {activeResults.renewableSharePct}%
                </td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#FFB84D]">
                  {activeResults.travelConvenienceIndex}%
                </td>
                <td className="py-2.5 px-3 text-right text-[11px] font-mono text-[#37D7FF]">
                  Current Edit
                </td>
              </tr>

              {/* Saved Scenarios */}
              {savedScenarios.map((scen) => (
                <tr key={scen.id} className="hover:bg-[#15243A] transition-colors">
                  <td className="py-2.5 px-3 text-[#F3F7FF]">
                    <div className="font-medium">{scen.name}</div>
                    {scen.notes && (
                      <div className="text-[10px] text-[#8EA2BE] line-clamp-1">{scen.notes}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                    {scen.results.trafficCongestionIndex}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                    {scen.results.avgSpeedKmh} km/h
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#39D98A]">
                    {scen.results.airQualityIndex} AQI
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#8EA2BE]">
                    {scen.results.energyDemandMW} MW
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#37D7FF]">
                    {scen.results.renewableSharePct}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#FFB84D]">
                    {scen.results.travelConvenienceIndex}%
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleLoadScenario(scen)}
                        className="text-[#37D7FF] hover:underline text-[11px] font-medium"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteScenario(scen.id)}
                        className="text-[#FF5D73] hover:underline text-[11px]"
                      >
                        Delete
                      </button>
                    </div>
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
