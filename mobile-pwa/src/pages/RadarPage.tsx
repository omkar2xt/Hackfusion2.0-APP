import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, TrendingUp, BarChart2, Radio, CheckCircle, Info, RefreshCw } from 'lucide-react';
import Header from '../components/Header';
import { api } from '../services/api';
import type { CyberRadarOverview, ExposureIntelligence, CampusWarning } from '../types';

export const RadarPage: React.FC = () => {
  const [radar, setRadar] = useState<CyberRadarOverview | null>(null);
  const [exposure, setExposure] = useState<ExposureIntelligence | null>(null);
  const [warnings, setWarnings] = useState<CampusWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [radarData, exposureData, warningsData] = await Promise.all([
        api.getCyberRadarOverview(),
        api.getExposureIntelligence(),
        api.getCampusWarnings(),
      ]);
      setRadar(radarData);
      setExposure(exposureData);
      setWarnings(warningsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load Cyber Radar intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getThreatLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-full font-bold text-xs uppercase tracking-wider animate-pulse">Critical Threat</span>;
      case 'HIGH':
        return <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full font-bold text-xs uppercase tracking-wider">High Threat</span>;
      case 'ELEVATED':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded-full font-bold text-xs uppercase tracking-wider">Elevated</span>;
      default:
        return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-bold text-xs uppercase tracking-wider">Normal</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-24">
      <Header
        title="Campus Cyber Radar"
        subtitle="Real-time campus threat posture"
        showBack
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Sub Header & Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold uppercase text-slate-300 tracking-wider">Live Campus Threat Intelligence</span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-teal-500/50 text-slate-300 hover:text-teal-400 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Radar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Campus Warnings (Immune System) */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Active Campus Security Advisories</span>
          </div>
          {warnings.map((w) => (
            <div key={w.id} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-amber-300">{w.title}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                  {w.severity}
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mb-2">{w.summary}</p>
              {w.recommendations && w.recommendations.length > 0 && (
                <div className="text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-amber-500/20 text-slate-300">
                  <div className="font-semibold text-amber-400 mb-1">Recommended Precautions:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {w.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Threat Posture Card */}
      {radar && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase text-slate-400">Campus Threat Posture</span>
            {getThreatLevelBadge(radar.threat_level)}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/40">
              <div className="text-2xl font-bold text-teal-400">{radar.total_threats}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Total Threats</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/40">
              <div className="text-2xl font-bold text-slate-100">{radar.scans_last_7_days}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Scans (7d)</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/40">
              <div className="text-2xl font-bold text-amber-400">{radar.incidents_last_7_days}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Incidents (7d)</div>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Desktop Grid for Trends & Exposure Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* 7-Day Threat Activity Trend */}
          {radar && radar.trend_last_7_days && radar.trend_last_7_days.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-200">7-Day Threat Vector Trend</h3>
              </div>
              <div className="space-y-2">
                {radar.trend_last_7_days.map((item, idx) => {
                  const maxVal = Math.max(...radar.trend_last_7_days.map(d => d.scans + d.incidents), 1);
                  const pct = Math.min(100, Math.round(((item.scans + item.incidents) / maxVal) * 100));
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="w-20 text-slate-400 text-[11px]">{item.date}</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden flex">
                        <div
                          style={{ width: `${pct}%` }}
                          className="bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full h-full transition-all duration-500"
                        />
                      </div>
                      <span className="w-12 text-right font-medium text-slate-300 text-[11px]">
                        {item.scans + item.incidents}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Severity Breakdown */}
          {radar && radar.severity_distribution && (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-200">Severity Distribution</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(radar.severity_distribution).map(([sev, count]) => (
                  <div key={sev} className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center justify-between">
                    <span className="text-xs uppercase font-medium text-slate-300">{sev}</span>
                    <span className="text-sm font-bold text-teal-400">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feature 3: Next-Target Exposure Intelligence */}
        <div>
          {exposure && (
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-200">Next-Target Exposure Intelligence</h3>
                </div>
                {exposure.data_sufficiency_met ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle className="w-3 h-3" /> Data Sufficient
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Info className="w-3 h-3" /> Low Sample Size
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400">{exposure.explanation}</p>

              <div className="space-y-3">
                {exposure.department_patterns.map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-100">{p.department}</span>
                      <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        Trend: {p.trend}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.threat_types.map((t, tidx) => (
                        <span key={tidx} className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/20 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">{p.guidance}</p>
                  </div>
                ))}
              </div>

              {exposure.general_recommendations && exposure.general_recommendations.length > 0 && (
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="font-semibold text-cyan-400">Campus Defense Guidance:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                    {exposure.general_recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

