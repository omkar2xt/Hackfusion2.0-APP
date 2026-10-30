import {
  Send,
  Filter,
  SearchCode,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  Flame,
  AlertOctagon,
  Info,
  ArrowDown,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  variant?: 'incident' | 'scan' | 'severity';
}

interface BadgeStyle {
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}

function getIncidentBadge(status: string): BadgeStyle {
  switch (status) {
    case 'submitted':
      return {
        bg: 'bg-blue-500/15',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        icon: <Send size={12} />,
        label: 'Submitted',
      };
    case 'triaged':
      return {
        bg: 'bg-yellow-500/15',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
        icon: <Filter size={12} />,
        label: 'Triaged',
      };
    case 'investigating':
      return {
        bg: 'bg-purple-500/15',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        icon: <SearchCode size={12} />,
        label: 'Investigating',
      };
    case 'resolved':
      return {
        bg: 'bg-green-500/15',
        text: 'text-green-400',
        border: 'border-green-500/30',
        icon: <CheckCircle2 size={12} />,
        label: 'Resolved',
      };
    case 'closed':
      return {
        bg: 'bg-gray-500/15',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
        icon: <XCircle size={12} />,
        label: 'Closed',
      };
    default:
      return {
        bg: 'bg-gray-500/15',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
        icon: <Info size={12} />,
        label: status.charAt(0).toUpperCase() + status.slice(1),
      };
  }
}

function getScanBadge(verdict: string): BadgeStyle {
  switch (verdict) {
    case 'MALICIOUS':
      return {
        bg: 'bg-red-500/15',
        text: 'text-red-400',
        border: 'border-red-500/30',
        icon: <ShieldAlert size={12} />,
        label: 'Malicious',
      };
    case 'SUSPICIOUS':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        icon: <AlertTriangle size={12} />,
        label: 'Suspicious',
      };
    case 'LOW_RISK':
      return {
        bg: 'bg-teal-500/15',
        text: 'text-teal-400',
        border: 'border-teal-500/30',
        icon: <ShieldCheck size={12} />,
        label: 'Low Risk',
      };
    case 'UNKNOWN':
    default:
      return {
        bg: 'bg-gray-500/15',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
        icon: <HelpCircle size={12} />,
        label: 'Unknown',
      };
  }
}

function getSeverityBadge(severity: string): BadgeStyle {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-500/15',
        text: 'text-red-400',
        border: 'border-red-500/30',
        icon: <Flame size={12} />,
        label: 'Critical',
      };
    case 'high':
      return {
        bg: 'bg-orange-500/15',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        icon: <AlertOctagon size={12} />,
        label: 'High',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-500/15',
        text: 'text-yellow-400',
        border: 'border-yellow-500/30',
        icon: <AlertTriangle size={12} />,
        label: 'Medium',
      };
    case 'low':
      return {
        bg: 'bg-blue-500/15',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        icon: <ArrowDown size={12} />,
        label: 'Low',
      };
    default:
      return {
        bg: 'bg-gray-500/15',
        text: 'text-gray-400',
        border: 'border-gray-500/30',
        icon: <Info size={12} />,
        label: severity.charAt(0).toUpperCase() + severity.slice(1),
      };
  }
}

export default function StatusBadge({ status, variant = 'incident' }: StatusBadgeProps) {
  let badge: BadgeStyle;

  switch (variant) {
    case 'scan':
      badge = getScanBadge(status);
      break;
    case 'severity':
      badge = getSeverityBadge(status);
      break;
    case 'incident':
    default:
      badge = getIncidentBadge(status);
      break;
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-xs font-semibold border whitespace-nowrap
        ${badge.bg} ${badge.text} ${badge.border}
      `}
    >
      {badge.icon}
      {badge.label}
    </span>
  );
}
