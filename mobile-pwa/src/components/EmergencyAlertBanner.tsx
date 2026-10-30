import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle,
  Radio,
  CheckCircle2,
  X,
  ShieldAlert,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { api } from '../services/api';
import type { EmergencyAlert, AlertDeliveryMetric } from '../types';

export const EmergencyAlertBanner: React.FC = () => {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [activeModalAlert, setActiveModalAlert] = useState<EmergencyAlert | null>(null);
  const [metrics, setMetrics] = useState<AlertDeliveryMetric | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [ackResult, setAckResult] = useState<{ ack_hash: string } | null>(null);

  // Get or create unique persistent device token in browser localStorage
  const getDeviceId = (): string => {
    let id = localStorage.getItem('signalsafe_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('signalsafe_device_id', id);
    }
    return id;
  };

  const fetchActiveAlerts = useCallback(async () => {
    try {
      const deviceId = getDeviceId();
      const data = await api.getActiveEmergencyAlerts(deviceId);
      // Filter out alerts already acknowledged on this device
      const unacknowledged = data.filter((a) => !a.is_acknowledged && a.status === 'ACTIVE');
      setAlerts(unacknowledged);
    } catch {
      // Background check failed - ignore silently
    }
  }, []);

  useEffect(() => {
    fetchActiveAlerts();
    // Poll every 30 seconds for live emergency relay
    const timer = setInterval(fetchActiveAlerts, 30000);
    return () => clearInterval(timer);
  }, [fetchActiveAlerts]);

  const handleOpenProtocol = async (alert: EmergencyAlert) => {
    setActiveModalAlert(alert);
    setAckResult(null);
    try {
      const deliveryData = await api.getAlertDeliveries(alert.id);
      setMetrics(deliveryData);
    } catch {
      // ignore
    }
  };

  const handleAcknowledge = async () => {
    if (!activeModalAlert) return;
    setAcknowledging(true);
    try {
      const deviceId = getDeviceId();
      const res = await api.acknowledgeEmergencyAlert(activeModalAlert.id, deviceId);
      setAckResult({ ack_hash: res.ack_hash });
      // Remove alert from banner list
      setAlerts((prev) => prev.filter((a) => a.id !== activeModalAlert.id));
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge alert');
    } finally {
      setAcknowledging(false);
    }
  };

  if (alerts.length === 0) return null;

  const currentAlert = alerts[0];

  return (
    <>
      {/* Top Banner Alert Bar */}
      <div className="bg-gradient-to-r from-red-650 via-rose-600 to-red-700 bg-red-600 text-white px-3 sm:px-4 py-2.5 shadow-xl relative z-40 border-b border-red-500/80 animate-in slide-in-from-top duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-wider bg-black/40 px-2 py-0.5 rounded text-amber-300 border border-amber-300/30">
                  CAMPUS RED ALERT • {currentAlert.severity}
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {currentAlert.category}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-red-800/60 px-2 py-0.5 rounded-full text-red-100 border border-red-400/30">
                  <Radio className="w-3 h-3 text-red-300 animate-ping" />
                  {currentAlert.target_zone}
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium truncate mt-0.5">
                {currentAlert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => handleOpenProtocol(currentAlert)}
              className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white font-bold text-xs border border-white/30 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow"
            >
              <span>Review Protocol & Acknowledge</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Protocol & Acknowledgment Modal */}
      {activeModalAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border-2 border-red-500/70 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-red-400">
                      Emergency Warning Protocol
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold uppercase">
                      {activeModalAlert.severity}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    {activeModalAlert.title || activeModalAlert.category}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveModalAlert(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Scope & Location */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Radio className="w-4 h-4 text-red-400" />
                <span>Targeted Proximity Zone:</span>
                <strong className="text-teal-300 font-semibold">{activeModalAlert.target_zone}</strong>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {activeModalAlert.delivery_scope}
              </span>
            </div>

            {/* Threat Description */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Incident Warning Summary
              </span>
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs sm:text-sm text-red-200 leading-relaxed">
                {activeModalAlert.message}
              </div>
            </div>

            {/* Containment Playbook Instructions */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Required Security Containment Protocol
              </span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {activeModalAlert.action_instructions ||
                  '1. Disconnect immediately from unverified networks or rogue APs.\n2. Do not enter university credentials on suspicious login screens.\n3. Report rogue access points or malicious QR codes via SignalSafe Campus Reports.'}
              </div>
            </div>

            {/* Delivery Tracking Metrics */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Target Mesh Connected Devices:</span>
                <span className="font-bold text-white">
                  {metrics?.total_targeted ?? activeModalAlert.target_device_count} Devices
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Acknowledged by Users:</span>
                <span className="font-bold text-teal-400">
                  {metrics?.acknowledged ?? activeModalAlert.acknowledged_count} Acknowledged
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (((metrics?.acknowledged ?? activeModalAlert.acknowledged_count) || 1) /
                          Math.max(metrics?.total_targeted ?? activeModalAlert.target_device_count, 1)) *
                          100
                      )
                    )}%`,
                  }}
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Acknowledgment Result or Button */}
            {ackResult ? (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Protocol Acknowledged & Logged</span>
                </div>
                <div className="font-mono text-[11px] text-slate-400 break-all flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Audit Signature Hash: {ackResult.ack_hash}</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Your device has confirmed receipt of this emergency bulletin. Stay alert and follow security instructions.
                </p>
                <button
                  onClick={() => setActiveModalAlert(null)}
                  className="mt-2 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-xs transition"
                >
                  Close Bulletin
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalAlert(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Remind Me Later
                </button>
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  disabled={acknowledging}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-650 via-rose-600 to-red-600 hover:brightness-110 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {acknowledging ? (
                    <span>Logging Acknowledgment...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I Have Read & Acknowledge Protocol</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
