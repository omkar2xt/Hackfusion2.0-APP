import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Radio,
  ChevronRight,
  X,
  ShieldAlert,
  CheckCircle2,
  Fingerprint,
} from 'lucide-react';
import { api } from '../services/api';
import type { EmergencyAlert, AlertDeliveryMetric } from '../types';

export const EmergencyAlertBanner: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [activeModalAlert, setActiveModalAlert] = useState<EmergencyAlert | null>(null);
  const [metrics, setMetrics] = useState<AlertDeliveryMetric | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [ackResult, setAckResult] = useState<{ ack_hash?: string } | null>(null);

  const fetchActiveAlerts = async () => {
    try {
      const data = await api.getActiveEmergencyAlerts();
      if (Array.isArray(data)) {
        setActiveAlerts(data);
      }
    } catch {
      // Offline fallback: graceful silence
    }
  };

  useEffect(() => {
    fetchActiveAlerts();
    // Poll for emergency alerts every 45 seconds
    const interval = setInterval(fetchActiveAlerts, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenProtocol = async (alert: EmergencyAlert) => {
    setActiveModalAlert(alert);
    setAckResult(null);
    try {
      const metric = await api.getAlertMetrics(alert.id);
      setMetrics(metric);
    } catch {
      // fallback
    }
  };

  const handleAcknowledge = async () => {
    if (!activeModalAlert) return;
    setAcknowledging(true);
    try {
      const res = await api.acknowledgeAlert(activeModalAlert.id, {
        client_timestamp: new Date().toISOString(),
      });
      setAckResult(res);
      // Refresh metric
      api.getAlertMetrics(activeModalAlert.id).then(setMetrics).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge alert.');
    } finally {
      setAcknowledging(false);
    }
  };

  if (!activeAlerts || activeAlerts.length === 0) {
    return null;
  }

  const currentAlert = activeAlerts[0];

  return (
    <>
      {/* Top Banner Alert Bar */}
      <div className="bg-[#C74747] text-white px-3 sm:px-4 py-2.5 shadow-sm relative z-40 border-b border-[#A63636] animate-in slide-in-from-top duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-black/20 border border-white/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-black/25 px-2 py-0.5 rounded text-white border border-white/20">
                  CAMPUS RED ALERT • {currentAlert.severity}
                </span>
                <span className="text-xs font-bold text-white truncate">
                  {currentAlert.category}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-black/20 px-2 py-0.5 rounded-full text-white/90">
                  <Radio className="w-3 h-3 text-white animate-pulse" />
                  {currentAlert.target_zone}
                </span>
              </div>
              <p className="text-xs text-white/90 font-medium truncate mt-0.5">
                {currentAlert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => handleOpenProtocol(currentAlert)}
              className="px-3 py-1.5 rounded-lg bg-black/25 hover:bg-black/35 text-white font-bold text-xs border border-white/30 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
            >
              <span>Review Protocol & Acknowledge</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Protocol & Acknowledgment Modal */}
      {activeModalAlert && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white border border-[#E5E9ED] rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9ED]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C74747]/10 border border-[#C74747]/25 flex items-center justify-center text-[#C74747]">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C74747]">
                      Emergency Warning Protocol
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C74747]/10 text-[#C74747] border border-[#C74747]/25 font-bold uppercase">
                      {activeModalAlert.severity}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#202A35] mt-0.5">
                    {activeModalAlert.title || activeModalAlert.category}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveModalAlert(null)}
                className="w-8 h-8 rounded-lg bg-[#F7F8FA] border border-[#E5E9ED] text-[#64748B] hover:text-[#202A35] flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Scope & Location */}
            <div className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#202A35]">
                <Radio className="w-4 h-4 text-[#C74747]" />
                <span>Targeted Proximity Zone:</span>
                <strong className="text-[#315E63] font-semibold">{activeModalAlert.target_zone}</strong>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] bg-white border border-[#E5E9ED] px-2 py-0.5 rounded">
                {activeModalAlert.delivery_scope}
              </span>
            </div>

            {/* Threat Description */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Incident Warning Summary
              </span>
              <div className="p-4 rounded-xl bg-[#C74747]/10 border border-[#C74747]/25 text-xs sm:text-sm text-[#C74747] font-medium leading-relaxed">
                {activeModalAlert.message}
              </div>
            </div>

            {/* Containment Playbook Instructions */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Required Security Containment Protocol
              </span>
              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] text-xs text-[#202A35] leading-relaxed whitespace-pre-wrap">
                {activeModalAlert.action_instructions ||
                  '1. Disconnect immediately from unverified networks or rogue APs.\n2. Do not enter university credentials on suspicious login screens.\n3. Report rogue access points or malicious QR codes via SignalSafe Campus Reports.'}
              </div>
            </div>

            {/* Delivery Tracking Metrics */}
            <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Target Mesh Connected Devices:</span>
                <span className="font-bold text-[#202A35]">
                  {metrics?.total_targeted ?? activeModalAlert.target_device_count} Devices
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Acknowledged by Users:</span>
                <span className="font-bold text-[#315E63]">
                  {metrics?.acknowledged ?? activeModalAlert.acknowledged_count} Acknowledged
                </span>
              </div>
              <div className="w-full bg-[#E5E9ED] h-2 rounded-full overflow-hidden">
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
                  className="bg-[#315E63] h-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Acknowledgment Result or Button */}
            {ackResult ? (
              <div className="p-4 rounded-xl bg-[#27845A]/10 border border-[#27845A]/25 text-[#27845A] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Protocol Acknowledged & Logged</span>
                </div>
                <div className="font-mono text-[11px] text-[#202A35] break-all flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-[#27845A] shrink-0" />
                  <span>Audit Signature Hash: {ackResult.ack_hash}</span>
                </div>
                <p className="text-[11px] text-[#202A35]">
                  Your device has confirmed receipt of this emergency bulletin. Stay alert and follow security instructions.
                </p>
                <button
                  onClick={() => setActiveModalAlert(null)}
                  className="mt-2 w-full py-2.5 bg-[#315E63] hover:bg-[#274B4F] text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Close Bulletin
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalAlert(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#202A35] font-semibold text-xs transition cursor-pointer"
                >
                  Remind Me Later
                </button>
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  disabled={acknowledging}
                  className="px-6 py-2.5 rounded-xl bg-[#C74747] hover:bg-[#B33E3E] text-white font-bold text-xs shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
