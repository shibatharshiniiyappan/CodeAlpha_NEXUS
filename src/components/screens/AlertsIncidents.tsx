import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  ShieldAlert,
  ArrowRight,
  Info,
  Check,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { Alert, AlertCategory, AlertSeverity, AlertStatus } from '../../types';

interface AlertsIncidentsProps {
  alerts: Alert[];
  onUpdateAlerts: (updated: Alert[]) => void;
  initialAlertId?: string;
}

export const AlertsIncidents: React.FC<AlertsIncidentsProps> = ({
  alerts,
  onUpdateAlerts,
  initialAlertId,
}) => {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(
    () => initialAlertId || (alerts.length > 0 ? alerts[0].id : null)
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [operatorNote, setOperatorNote] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId);

  // Severity summary counts
  const criticalCount = alerts.filter(
    (a) => a.severity === 'Critical' && a.status !== 'Resolved'
  ).length;
  const warningCount = alerts.filter(
    (a) => a.severity === 'Warning' && a.status !== 'Resolved'
  ).length;
  const moderateCount = alerts.filter(
    (a) => a.severity === 'Moderate' && a.status !== 'Resolved'
  ).length;
  const activeCount = alerts.filter((a) => a.status === 'Active').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'Acknowledged').length;
  const resolvedCount = alerts.filter((a) => a.status === 'Resolved').length;

  // Filter alerts
  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.districtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      severityFilter === 'All' || a.severity === severityFilter;
    const matchesCategory =
      categoryFilter === 'All' || a.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'All' || a.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
  });

  // Action: Acknowledge
  const handleAcknowledge = (id: string) => {
    const updated = alerts.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: 'Acknowledged' as AlertStatus,
          acknowledgedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
        };
      }
      return a;
    });
    onUpdateAlerts(updated);
    setActionFeedback(`Incident ${id} acknowledged by Operations Director.`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Action: Resolve
  const handleResolve = (id: string) => {
    const updated = alerts.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: 'Resolved' as AlertStatus,
          resolvedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
        };
      }
      return a;
    });
    onUpdateAlerts(updated);
    setActionFeedback(`Incident ${id} marked as RESOLVED and saved to audit ledger.`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Action: Reopen
  const handleReopen = (id: string) => {
    const updated = alerts.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: 'Active' as AlertStatus,
          resolvedAt: undefined,
        };
      }
      return a;
    });
    onUpdateAlerts(updated);
    setActionFeedback(`Incident ${id} REOPENED for further active investigation.`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Action: Reset demo alerts
  const handleResetDefaults = () => {
    localStorage.removeItem('nexus_smart_city_alerts_state_v1');
    window.location.reload();
  };

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'Critical':
        return 'bg-[#FF5D73]/20 text-[#FF5D73] border-[#FF5D73]/40';
      case 'Warning':
        return 'bg-[#FFB84D]/20 text-[#FFB84D] border-[#FFB84D]/40';
      case 'Moderate':
        return 'bg-[#4D7CFE]/20 text-[#4D7CFE] border-[#4D7CFE]/40';
      case 'Resolved':
      default:
        return 'bg-[#39D98A]/20 text-[#39D98A] border-[#39D98A]/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {actionFeedback && (
        <div className="p-3 bg-[#39D98A]/15 border border-[#39D98A]/40 text-[#39D98A] rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <span className="font-mono text-[10px]">LOCAL STORAGE PERSISTED</span>
        </div>
      )}

      {/* Severity & Status Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setSeverityFilter('Critical');
            setStatusFilter('All');
          }}
          className="p-4 bg-[#10182A] hover:bg-[#15243A] border border-[#23354D] hover:border-[#FF5D73]/50 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Critical Incidents</span>
            <ShieldAlert className="w-4 h-4 text-[#FF5D73]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#FF5D73]">
            {criticalCount}
          </div>
          <div className="mt-1 text-[11px] text-[#8EA2BE]">Immediate dispatch priority</div>
        </div>

        <div
          onClick={() => {
            setSeverityFilter('Warning');
            setStatusFilter('All');
          }}
          className="p-4 bg-[#10182A] hover:bg-[#15243A] border border-[#23354D] hover:border-[#FFB84D]/50 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Warning Level</span>
            <AlertTriangle className="w-4 h-4 text-[#FFB84D]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#FFB84D]">
            {warningCount}
          </div>
          <div className="mt-1 text-[11px] text-[#8EA2BE]">Sensor threshold drift</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('Active');
            setSeverityFilter('All');
          }}
          className="p-4 bg-[#10182A] hover:bg-[#15243A] border border-[#23354D] hover:border-[#00E5FF]/50 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Active Incidents</span>
            <Info className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#00E5FF]">
            {activeCount}
          </div>
          <div className="mt-1 text-[11px] text-[#8EA2BE]">
            {acknowledgedCount} Acknowledged
          </div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('Resolved');
            setSeverityFilter('All');
          }}
          className="p-4 bg-[#10182A] hover:bg-[#15243A] border border-[#23354D] hover:border-[#39D98A]/50 rounded-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#8EA2BE]">
            <span>Resolved Incidents</span>
            <CheckCircle2 className="w-4 h-4 text-[#39D98A]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#39D98A]">
            {resolvedCount}
          </div>
          <div className="mt-1 text-[11px] text-[#8EA2BE]">Telemetry normalized</div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 bg-[#10182A] border border-[#23354D] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-[#0B1120] border border-[#23354D] rounded-lg px-3 py-1.5 flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-[#00E5FF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search incident title, location, ID..."
            className="bg-transparent border-none text-[#F3F7FF] placeholder-[#8EA2BE] text-xs focus:outline-none flex-1"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0B1120] border border-[#23354D] text-[#F3F7FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Traffic">Traffic</option>
            <option value="Energy">Energy</option>
            <option value="Environment">Environment</option>
            <option value="Infrastructure">Infrastructure</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0B1120] border border-[#23354D] text-[#F3F7FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
            <option value="Moderate">Moderate</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0B1120] border border-[#23354D] text-[#F3F7FF] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
          </select>

          {(severityFilter !== 'All' || categoryFilter !== 'All' || statusFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSeverityFilter('All');
                setCategoryFilter('All');
                setStatusFilter('All');
                setSearchQuery('');
              }}
              className="text-[#00E5FF] hover:underline px-2 py-1"
            >
              Clear
            </button>
          )}

          <button
            onClick={handleResetDefaults}
            title="Reset incident state in localStorage"
            className="p-1.5 text-[#8EA2BE] hover:text-[#F3F7FF] hover:bg-[#15243A] rounded border border-[#23354D] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Alert List & Details Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List Column (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center bg-[#10182A] border border-[#23354D] rounded-xl space-y-3">
              <Filter className="w-8 h-8 text-[#8EA2BE] mx-auto opacity-50" />
              <div className="text-sm font-medium text-[#F3F7FF]">
                No operational incidents found
              </div>
              <p className="text-xs text-[#8EA2BE] max-w-sm mx-auto">
                No active or recorded incidents match the current filters. Try resetting the severity, category, or search filters.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#15243A] border-[#00E5FF] shadow-lg shadow-[#00E5FF]/5'
                      : 'bg-[#10182A] hover:bg-[#15243A]/60 border-[#23354D]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-[#8EA2BE]">
                          {alert.id}
                        </span>
                        <span className="text-xs text-[#8EA2BE]">·</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#0B1120] text-[#00E5FF]">
                          {alert.category}
                        </span>
                        <span className="text-xs text-[#8EA2BE]">·</span>
                        <span className="text-[11px] text-[#8EA2BE]">
                          {alert.districtName}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#F3F7FF]">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-[#8EA2BE] line-clamp-1 mt-1">
                        {alert.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getSeverityBadge(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          alert.status === 'Active'
                            ? 'bg-[#FF5D73]/15 text-[#FF5D73]'
                            : alert.status === 'Acknowledged'
                            ? 'bg-[#FFB84D]/15 text-[#FFB84D]'
                            : 'bg-[#39D98A]/15 text-[#39D98A]'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#23354D]/50 flex items-center justify-between text-[11px] text-[#8EA2BE]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp}
                    </span>
                    <span className="text-[#00E5FF] font-medium flex items-center gap-1">
                      View Protocol <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Details Panel Column (5 cols) */}
        <div className="lg:col-span-5 bg-[#10182A] border border-[#23354D] rounded-xl p-5 sticky top-20 space-y-4">
          {selectedAlert ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/30">
                    INCIDENT DOSSIER · {selectedAlert.id}
                  </span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border ${getSeverityBadge(
                      selectedAlert.severity
                    )}`}
                  >
                    {selectedAlert.severity}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#F3F7FF] mt-2 leading-snug">
                  {selectedAlert.title}
                </h3>
                <div className="text-xs text-[#8EA2BE] mt-1 flex items-center gap-2">
                  <span>Sector: {selectedAlert.districtName}</span>
                  <span>·</span>
                  <span>{selectedAlert.location}</span>
                </div>
              </div>

              {/* Status and Timestamp Badge */}
              <div className="p-3 bg-[#0B1120] rounded-lg border border-[#23354D] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8EA2BE]">Incident Status:</span>
                  <span
                    className={`font-semibold font-mono ${
                      selectedAlert.status === 'Active'
                        ? 'text-[#FF5D73]'
                        : selectedAlert.status === 'Acknowledged'
                        ? 'text-[#FFB84D]'
                        : 'text-[#39D98A]'
                    }`}
                  >
                    {selectedAlert.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-[#8EA2BE]">
                  <span>Telemetry First Logged:</span>
                  <span className="font-mono text-[#F3F7FF]">{selectedAlert.timestamp}</span>
                </div>
                {selectedAlert.acknowledgedAt && (
                  <div className="flex justify-between text-[#8EA2BE]">
                    <span>Acknowledged At:</span>
                    <span className="font-mono text-[#FFB84D]">{selectedAlert.acknowledgedAt}</span>
                  </div>
                )}
                {selectedAlert.resolvedAt && (
                  <div className="flex justify-between text-[#8EA2BE]">
                    <span>Resolved At:</span>
                    <span className="font-mono text-[#39D98A]">{selectedAlert.resolvedAt}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#F3F7FF]">
                  Root Cause & Description:
                </div>
                <p className="text-xs text-[#8EA2BE] leading-relaxed">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Affected Systems */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#F3F7FF]">
                  Impacted Systems & Infrastructure:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAlert.affectedSystems.map((sys, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono bg-[#15243A] text-[#00E5FF] px-2 py-0.5 rounded border border-[#23354D]"
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Response Protocol */}
              <div className="p-3 bg-[#15243A] rounded-lg border border-[#00E5FF]/30 space-y-1.5 text-xs">
                <div className="font-semibold text-[#00E5FF] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Recommended Operations Action:
                </div>
                <p className="text-xs text-[#F3F7FF] leading-relaxed">
                  {selectedAlert.recommendedAction}
                </p>
              </div>

              {/* Functional Acknowledge, Resolve & Reopen Actions */}
              <div className="pt-2 border-t border-[#23354D] space-y-2">
                <div className="flex items-center gap-2">
                  {selectedAlert.status === 'Active' && (
                    <button
                      onClick={() => handleAcknowledge(selectedAlert.id)}
                      className="flex-1 py-2 px-3 bg-[#FFB84D] hover:bg-[#e09f3b] text-[#070B16] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Acknowledge
                    </button>
                  )}

                  {selectedAlert.status !== 'Resolved' && (
                    <button
                      onClick={() => handleResolve(selectedAlert.id)}
                      className="flex-1 py-2 px-3 bg-[#39D98A] hover:bg-[#2db873] text-[#070B16] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  )}

                  {selectedAlert.status === 'Resolved' && (
                    <button
                      onClick={() => handleReopen(selectedAlert.id)}
                      className="flex-1 py-2 px-3 bg-[#15243A] hover:bg-[#1f3656] text-[#00E5FF] border border-[#23354D] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reopen Incident
                    </button>
                  )}
                </div>

                {/* Operator Note Input */}
                <div className="pt-2">
                  <label className="text-[11px] text-[#8EA2BE] block mb-1">
                    Log Operations Dispatch Note:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={operatorNote}
                      onChange={(e) => setOperatorNote(e.target.value)}
                      placeholder="e.g. Technician squad dispatched..."
                      className="flex-1 bg-[#0B1120] border border-[#23354D] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F7FF] placeholder-[#8EA2BE] focus:outline-none focus:border-[#00E5FF]"
                    />
                    <button
                      onClick={() => {
                        if (operatorNote.trim()) {
                          setActionFeedback(`Note appended to ${selectedAlert.id}: "${operatorNote}"`);
                          setOperatorNote('');
                          setTimeout(() => setActionFeedback(null), 3500);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#15243A] hover:bg-[#1f3656] text-[#00E5FF] text-xs font-medium rounded-lg border border-[#23354D] transition-colors"
                    >
                      Append
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#8EA2BE]">
              Select an incident from the log to review operational directives.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
