import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Clock,
  HelpCircle,
  CheckCircle2,
  Info,
  Navigation,
  Wind,
  Zap,
  Building2,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { RiskAssessment, RiskHorizon, RiskCategory, ScreenId } from '../../types';
import { getPredictiveRiskAssessments } from '../../utils/predictiveRiskCalculations';
import { InteractiveChart } from '../common/ChartWrapper';

interface PredictiveRiskEngineProps {
  onNavigate: (screen: ScreenId, entityId?: string) => void;
}

export const PredictiveRiskEngine: React.FC<PredictiveRiskEngineProps> = ({
  onNavigate,
}) => {
  const [horizon, setHorizon] = useState<RiskHorizon>('24h');
  const [selectedRiskId, setSelectedRiskId] = useState<string>('risk-traffic');
  const [showFactorModal, setShowFactorModal] = useState<boolean>(false);

  const assessments = getPredictiveRiskAssessments(horizon);
  const selectedAssessment =
    assessments.find((a) => a.id === selectedRiskId) || assessments[0];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return '#FF5D73';
      case 'High':
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
      {/* Top Header & Forecast Horizon Control */}
      <div className="p-4 bg-[#101B2C] border border-[#23354D] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <h2 className="text-base font-semibold text-[#F3F7FF] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#FF5D73]" />
            NEXUS Predictive Risk Engine · Multi-Horizon Early Warning
          </h2>
          <p className="text-[#8EA2BE] mt-0.5">
            Deterministic risk extrapolation models analyzing congestion queues, atmospheric inversions, and grid saturation.
          </p>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0B1220] rounded-lg border border-[#23354D]">
          <span className="text-xs text-[#8EA2BE] px-2">Forecast Horizon:</span>
          {(['6h', '24h', '7d'] as RiskHorizon[]).map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                horizon === h
                  ? 'bg-[#37D7FF] text-[#070B14] font-bold shadow-sm'
                  : 'text-[#8EA2BE] hover:text-[#F3F7FF]'
              }`}
            >
              {h === '6h' ? '6 Hours' : h === '24h' ? '24 Hours' : '7 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Prototype Notice */}
      <div className="p-3 bg-[#15243A] border border-[#23354D] rounded-xl flex items-center justify-between text-xs text-[#8EA2BE]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#37D7FF] shrink-0" />
          <span>
            Prototype Predictive Model: Calculations are deterministic sample extrapolations for decision-support demonstration.
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#37D7FF] bg-[#101B2C] px-2 py-0.5 rounded border border-[#23354D]">
          CONFIDENCE: {selectedAssessment.confidencePct}%
        </span>
      </div>

      {/* 4 Category Risk Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {assessments.map((item) => {
          const isSelected = item.id === selectedRiskId;
          const color = getRiskColor(item.riskLevel);
          const Icon =
            item.category === 'traffic'
              ? Navigation
              : item.category === 'air-quality'
              ? Wind
              : item.category === 'energy'
              ? Zap
              : Building2;

          return (
            <div
              key={item.id}
              onClick={() => setSelectedRiskId(item.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#15243A] border-[#37D7FF] shadow-lg shadow-[#37D7FF]/10'
                  : 'bg-[#101B2C] hover:bg-[#15243A]/70 border-[#23354D]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1.5 rounded-md"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-[#8EA2BE] uppercase font-mono tracking-wider">
                      {item.category.replace('-', ' ')}
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: `${color}15`,
                      color,
                      borderColor: `${color}40`,
                    }}
                  >
                    {item.riskLevel}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-xs font-semibold text-[#F3F7FF] line-clamp-1">
                    {item.title}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono tabular-nums text-[#F3F7FF]">
                      {item.riskScore}
                    </span>
                    <span className="text-xs text-[#8EA2BE]">/ 100 Risk</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#23354D]/50 flex items-center justify-between text-xs">
                <span className="text-[#8EA2BE] font-mono text-[11px]">
                  Forecast: {item.forecastValue} {item.unit}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: isSelected ? '#37D7FF' : '#8EA2BE' }}
                >
                  Inspect &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Risk Deep-Dive & Forecast Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Forecast Time-Series Chart (7 cols) */}
        <div className="lg:col-span-7 p-5 bg-[#101B2C] border border-[#23354D] rounded-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#F3F7FF]">
                  {selectedAssessment.title}
                </h3>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${getRiskColor(selectedAssessment.riskLevel)}20`,
                    color: getRiskColor(selectedAssessment.riskLevel),
                  }}
                >
                  {selectedAssessment.riskLevel} Risk
                </span>
              </div>
              <p className="text-xs text-[#8EA2BE] mt-0.5">
                Historical observation baseline (past 4 hours) vs Projected future trajectory (+{horizon})
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-[#8EA2BE]">
                <span className="w-2.5 h-0.5 bg-[#37D7FF]" /> Observed
              </span>
              <span className="flex items-center gap-1.5 text-[#FFB84D]">
                <span className="w-2.5 h-0.5 bg-[#FFB84D] border-dashed" /> Forecast (+{horizon})
              </span>
            </div>
          </div>

          {/* Forecast Chart */}
          <InteractiveChart
            data={selectedAssessment.chartData}
            primaryLabel={`Telemetry Value (${selectedAssessment.unit})`}
            primaryUnit={selectedAssessment.unit}
            primaryColor={getRiskColor(selectedAssessment.riskLevel)}
            height={230}
          />

          {/* Mathematical Calculation Method */}
          <div className="p-3 bg-[#0B1220] rounded-lg border border-[#23354D] text-xs space-y-1">
            <span className="font-mono text-[#37D7FF] block text-[11px]">
              CALCULATION METHODOLOGY:
            </span>
            <p className="text-[#8EA2BE] leading-relaxed">
              {selectedAssessment.calculationMethod}
            </p>
          </div>
        </div>

        {/* Right Column: Contributing Factors & Mitigations (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-[#101B2C] border border-[#23354D] rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#23354D] pb-3">
            <span className="text-sm font-semibold text-[#F3F7FF] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#37D7FF]" />
              Why is this risk elevated?
            </span>
            <span className="text-xs font-mono text-[#37D7FF]">
              {selectedAssessment.confidencePct}% Confidence
            </span>
          </div>

          {/* Contributing Factors Breakdown */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-[#8EA2BE]">
              Primary Root Contributing Drivers:
            </div>
            {selectedAssessment.contributingFactors.map((f, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#0B1220] border border-[#23354D]/70 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F3F7FF]">{f.factor}</span>
                  <span className="font-mono font-bold text-[#37D7FF]">
                    {f.weightPct}% Weight
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-[#15243A] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#37D7FF] rounded-full"
                    style={{ width: `${f.weightPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#8EA2BE] leading-relaxed pt-0.5">
                  {f.explanation}
                </p>
              </div>
            ))}
          </div>

          {/* Recommended Operational Mitigation */}
          <div className="p-3.5 bg-[#15243A] border border-[#37D7FF]/30 rounded-lg space-y-1.5 text-xs">
            <div className="font-semibold text-[#37D7FF] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#39D98A]" />
              Recommended Operational Mitigation:
            </div>
            <p className="text-[#F3F7FF] leading-relaxed">
              {selectedAssessment.suggestedMitigation}
            </p>
          </div>

          {/* Link to Alert / District */}
          <div className="pt-2 border-t border-[#23354D] flex items-center justify-between text-xs">
            {selectedAssessment.relatedAlertId && (
              <button
                onClick={() => onNavigate('alerts', selectedAssessment.relatedAlertId)}
                className="text-[#37D7FF] hover:underline flex items-center gap-1"
              >
                <span>Inspect Related Alert ({selectedAssessment.relatedAlertId})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}

            {selectedAssessment.category === 'traffic' && (
              <button
                onClick={() => onNavigate('mobility')}
                className="text-[#8EA2BE] hover:text-[#F3F7FF] flex items-center gap-1"
              >
                <span>Open Mobility</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            {selectedAssessment.category === 'energy' && (
              <button
                onClick={() => onNavigate('environment')}
                className="text-[#8EA2BE] hover:text-[#F3F7FF] flex items-center gap-1"
              >
                <span>Open Energy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
