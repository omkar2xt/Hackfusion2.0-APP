import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Copy,
  Flag,
  Clock,
} from 'lucide-react';
import type { ScanResult } from '../types';
import { getRiskColor, getRiskBgColor, getScorePercentage, formatDate } from '../utils/helpers';
import { useState } from 'react';

import CyberSafetyAssistant from './CyberSafetyAssistant';

interface ScanResultCardProps {
  result: ScanResult | null;
  loading: boolean;
  onReport?: (result: ScanResult) => void;
}

function getVerdictIcon(verdict: string) {
  switch (verdict) {
    case 'MALICIOUS':
      return <ShieldAlert size={20} />;
    case 'SUSPICIOUS':
      return <AlertTriangle size={20} />;
    case 'LOW_RISK':
      return <ShieldCheck size={20} />;
    case 'UNKNOWN':
    default:
      return <HelpCircle size={20} />;
  }
}

function getVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'MALICIOUS':
      return 'Malicious';
    case 'SUSPICIOUS':
      return 'Suspicious';
    case 'LOW_RISK':
      return 'Low Risk';
    case 'UNKNOWN':
    default:
      return 'Unknown';
  }
}

function getScoreStrokeColor(verdict: string): string {
  switch (verdict) {
    case 'MALICIOUS':
      return '#ef4444';
    case 'SUSPICIOUS':
      return '#f59e0b';
    case 'LOW_RISK':
      return '#14b8a6';
    case 'UNKNOWN':
    default:
      return '#6b7280';
  }
}

function SkeletonLoader() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 animate-pulse space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-700/60" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-28 bg-slate-700/60 rounded" />
          <div className="h-4 w-20 bg-slate-700/60 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-700/60 rounded" />
        <div className="h-4 w-3/4 bg-slate-700/60 rounded" />
        <div className="h-4 w-5/6 bg-slate-700/60 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-700/60 rounded" />
        <div className="h-4 w-2/3 bg-slate-700/60 rounded" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 flex-1 bg-slate-700/60 rounded-lg" />
        <div className="h-9 flex-1 bg-slate-700/60 rounded-lg" />
      </div>
    </div>
  );
}

function CircularScore({ score, verdict }: { score: number; verdict: string }) {
  const percentage = getScorePercentage(score);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const strokeColor = getScoreStrokeColor(verdict);

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-slate-700/40"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{percentage}</span>
      </div>
    </div>
  );
}

export default function ScanResultCard({ result, loading, onReport }: ScanResultCardProps) {
  const [copied, setCopied] = useState(false);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!result) {
    return null;
  }

  const handleCopy = async () => {
    const text = [
      `Verdict: ${result.verdict}`,
      `Risk Score: ${result.risk_score}/100`,
      `Risk Level: ${result.risk_level}`,
      `Input: ${result.input_value}`,
      `Scanned: ${new Date(result.checked_at).toLocaleString()}`,
      '',
      'Indicators:',
      ...result.indicators.map((i) => `- ${i}`),
      '',
      'Recommendations:',
      ...result.recommendations.map((r) => `- ${r}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 space-y-5">
      {/* Header: Score + Verdict */}
      <div className="flex items-center gap-4">
        <CircularScore score={result.risk_score} verdict={result.verdict} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border
                ${getRiskBgColor(result.verdict)} ${getRiskColor(result.verdict)}
              `}
            >
              {getVerdictIcon(result.verdict)}
              {getVerdictLabel(result.verdict)}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Risk Level: <span className={`font-medium ${getRiskColor(result.verdict)}`}>{result.risk_level}</span>
          </p>
        </div>
      </div>

      {/* Indicators */}
      {result.indicators.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Indicators</h4>
          <ul className="space-y-1.5">
            {result.indicators.map((indicator, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recommendations</h4>
          <ul className="space-y-1.5">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Innovation 6: Personalized Cyber Safety Assistant */}
      {(result.verdict === 'MALICIOUS' || result.verdict === 'SUSPICIOUS' || result.risk_score >= 40) && (
        <CyberSafetyAssistant
          threatType={result.input_type}
          verdict={result.verdict}
          payload={result.input_value}
          score={result.risk_score}
        />
      )}

      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Clock size={12} />
        <span>Scanned {formatDate(result.checked_at)}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-slate-700/50 border border-slate-600/50 text-sm font-medium text-slate-300
            hover:bg-slate-700 active:scale-[0.98] transition-all duration-150"
        >
          <Copy size={15} />
          {copied ? 'Copied!' : 'Copy Result'}
        </button>
        <button
          onClick={() => onReport && onReport(result)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-red-500/10 border border-red-500/30 text-sm font-medium text-red-400
            hover:bg-red-500/20 active:scale-[0.98] transition-all duration-150"
        >
          <Flag size={15} />
          Report
        </button>
      </div>
    </div>
  );
}
