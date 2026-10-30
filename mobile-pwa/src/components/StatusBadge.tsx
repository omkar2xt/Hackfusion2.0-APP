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
        bg: 'bg-[#477B9B]/10',
        text: 'text-[#477B9B]',
        border: 'border-[#477B9B]/25',
        icon: <Send size={12} />,
        label: 'Submitted',
      };
    case 'triaged':
      return {
        bg: 'bg-[#315E63]/10',
        text: 'text-[#315E63]',
        border: 'border-[#315E63]/25',
        icon: <Filter size={12} />,
        label: 'Triaged',
      };
    case 'investigating':
      return {
        bg: 'bg-[#C58A35]/10',
        text: 'text-[#C58A35]',
        border: 'border-[#C58A35]/25',
        icon: <SearchCode size={12} />,
        label: 'Investigating',
      };
    case 'resolved':
      return {
        bg: 'bg-[#27845A]/10',
        text: 'text-[#27845A]',
        border: 'border-[#27845A]/25',
        icon: <CheckCircle2 size={12} />,
        label: 'Resolved',
      };
    case 'closed':
      return {
        bg: 'bg-[#F0F4F4]',
        text: 'text-[#64748B]',
        border: 'border-[#E5E9ED]',
        icon: <XCircle size={12} />,
        label: 'Closed',
      };
    default:
      return {
        bg: 'bg-[#F0F4F4]',
        text: 'text-[#64748B]',
        border: 'border-[#E5E9ED]',
        icon: <Info size={12} />,
        label: status.charAt(0).toUpperCase() + status.slice(1),
      };
  }
}

function getScanBadge(verdict: string): BadgeStyle {
  switch (verdict) {
    case 'MALICIOUS':
      return {
        bg: 'bg-[#C74747]/10',
        text: 'text-[#C74747]',
        border: 'border-[#C74747]/25',
        icon: <ShieldAlert size={12} />,
        label: 'Malicious',
      };
    case 'SUSPICIOUS':
      return {
        bg: 'bg-[#C58A35]/10',
        text: 'text-[#C58A35]',
        border: 'border-[#C58A35]/25',
        icon: <AlertTriangle size={12} />,
        label: 'Suspicious',
      };
    case 'LOW_RISK':
      return {
        bg: 'bg-[#27845A]/10',
        text: 'text-[#27845A]',
        border: 'border-[#27845A]/25',
        icon: <ShieldCheck size={12} />,
        label: 'Low Risk',
      };
    case 'UNKNOWN':
    default:
      return {
        bg: 'bg-[#F0F4F4]',
        text: 'text-[#64748B]',
        border: 'border-[#E5E9ED]',
        icon: <HelpCircle size={12} />,
        label: 'Unknown',
      };
  }
}

function getSeverityBadge(severity: string): BadgeStyle {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-[#C74747]/10',
        text: 'text-[#C74747]',
        border: 'border-[#C74747]/25',
        icon: <Flame size={12} />,
        label: 'Critical',
      };
    case 'high':
      return {
        bg: 'bg-[#C58A35]/15',
        text: 'text-[#C58A35]',
        border: 'border-[#C58A35]/30',
        icon: <AlertOctagon size={12} />,
        label: 'High',
      };
    case 'medium':
      return {
        bg: 'bg-[#C58A35]/10',
        text: 'text-[#C58A35]',
        border: 'border-[#C58A35]/25',
        icon: <AlertTriangle size={12} />,
        label: 'Medium',
      };
    case 'low':
      return {
        bg: 'bg-[#27845A]/10',
        text: 'text-[#27845A]',
        border: 'border-[#27845A]/25',
        icon: <ArrowDown size={12} />,
        label: 'Low',
      };
    default:
      return {
        bg: 'bg-[#F0F4F4]',
        text: 'text-[#64748B]',
        border: 'border-[#E5E9ED]',
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
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-xs font-semibold border whitespace-nowrap
        ${badge.bg} ${badge.text} ${badge.border}
      `}
    >
      {badge.icon}
      {badge.label}
    </span>
  );
}
