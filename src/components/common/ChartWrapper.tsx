import React, { useState } from 'react';
import { TimeSeriesPoint } from '../../types';

interface ChartWrapperProps {
  data: TimeSeriesPoint[];
  title?: string;
  height?: number;
  primaryLabel: string;
  secondaryLabel?: string;
  primaryUnit?: string;
  secondaryUnit?: string;
  primaryColor?: string;
  secondaryColor?: string;
  showTarget?: boolean;
}

export const InteractiveChart: React.FC<ChartWrapperProps> = ({
  data,
  height = 200,
  primaryLabel,
  secondaryLabel,
  primaryUnit = '',
  secondaryUnit = '',
  primaryColor = '#37D7FF',
  secondaryColor = '#9B7BFF',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-[#8EA2BE]">
        No telemetry data available
      </div>
    );
  }

  const primaryValues = data.map((d) => d.value);
  const secondaryValues = data.map((d) => d.secondaryValue ?? 0);
  const maxPrimary = Math.max(...primaryValues, 10);
  const minPrimary = Math.min(...primaryValues, 0);
  const hasSecondary = data.some((d) => d.secondaryValue !== undefined);
  const maxSecondary = hasSecondary ? Math.max(...secondaryValues, 10) : 1;

  // Chart dimensions inside SVG
  const paddingX = 40;
  const paddingY = 24;
  const svgWidth = 600;
  const svgHeight = height;

  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  // Normalized points for primary
  const primaryPoints = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartW;
    const norm = (d.value - minPrimary * 0.8) / ((maxPrimary * 1.15) - minPrimary * 0.8 || 1);
    const y = paddingY + chartH - Math.max(0, Math.min(1, norm)) * chartH;
    return { x, y, ...d };
  });

  // Normalized points for secondary
  const secondaryPoints = hasSecondary
    ? data.map((d, i) => {
        const x = paddingX + (i / (data.length - 1)) * chartW;
        const norm = (d.secondaryValue || 0) / (maxSecondary * 1.2 || 1);
        const y = paddingY + chartH - Math.max(0, Math.min(1, norm)) * chartH;
        return { x, y, ...d };
      })
    : [];

  const primaryPathStr = primaryPoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const primaryAreaStr = `${primaryPathStr} L ${primaryPoints[primaryPoints.length - 1].x} ${
    paddingY + chartH
  } L ${primaryPoints[0].x} ${paddingY + chartH} Z`;

  const secondaryPathStr = hasSecondary
    ? secondaryPoints.reduce(
        (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
        ''
      )
    : '';

  const activePoint = hoverIndex !== null ? primaryPoints[hoverIndex] : null;

  return (
    <div className="relative w-full select-none">
      {/* Legend */}
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="text-[#8EA2BE]">{primaryLabel}</span>
          </div>
          {hasSecondary && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: secondaryColor }}
              />
              <span className="text-[#8EA2BE]">{secondaryLabel}</span>
            </div>
          )}
        </div>

        {activePoint && (
          <div className="flex items-center gap-2 font-mono tabular-nums text-xs bg-[#15243A] px-2.5 py-1 rounded border border-[#23354D]">
            <span className="text-[#8EA2BE]">{activePoint.timeLabel}:</span>
            <span style={{ color: primaryColor }} className="font-semibold">
              {activePoint.value.toLocaleString()} {primaryUnit}
            </span>
            {hasSecondary && activePoint.secondaryValue !== undefined && (
              <>
                <span className="text-[#8EA2BE]">·</span>
                <span style={{ color: secondaryColor }} className="font-semibold">
                  {activePoint.secondaryValue.toLocaleString()} {secondaryUnit}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={`grad-primary-${primaryColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = paddingY + chartH * pct;
          return (
            <line
              key={idx}
              x1={paddingX}
              y1={y}
              x2={svgWidth - paddingX}
              y2={y}
              stroke="#23354D"
              strokeDasharray="3 3"
              strokeOpacity="0.5"
            />
          );
        })}

        {/* Area fill */}
        <path
          d={primaryAreaStr}
          fill={`url(#grad-primary-${primaryColor.replace('#', '')})`}
        />

        {/* Secondary line if present */}
        {hasSecondary && (
          <path
            d={secondaryPathStr}
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        )}

        {/* Primary Line */}
        <path
          d={primaryPathStr}
          fill="none"
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-axis labels */}
        {data.map((d, i) => {
          // Show labels spaced out
          const step = Math.ceil(data.length / 6);
          if (i % step !== 0 && i !== data.length - 1) return null;
          const x = paddingX + (i / (data.length - 1)) * chartW;
          return (
            <text
              key={i}
              x={x}
              y={svgHeight - 4}
              fontSize="10"
              fill="#8EA2BE"
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
            >
              {d.timeLabel}
            </text>
          );
        })}

        {/* Interactive hover regions */}
        {primaryPoints.map((pt, i) => (
          <g key={i}>
            <rect
              x={pt.x - (chartW / (data.length * 2))}
              y={0}
              width={chartW / data.length}
              height={svgHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
            {hoverIndex === i && (
              <>
                <line
                  x1={pt.x}
                  y1={paddingY}
                  x2={pt.x}
                  y2={paddingY + chartH}
                  stroke="#37D7FF"
                  strokeWidth="1"
                  strokeOpacity="0.8"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="#070B14"
                  stroke={primaryColor}
                  strokeWidth="2"
                />
                {hasSecondary && secondaryPoints[i] && (
                  <circle
                    cx={secondaryPoints[i].x}
                    cy={secondaryPoints[i].y}
                    r="4"
                    fill="#070B14"
                    stroke={secondaryColor}
                    strokeWidth="2"
                  />
                )}
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};
