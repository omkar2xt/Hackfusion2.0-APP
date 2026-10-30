export function getRiskColor(verdict: string): string {
  switch (verdict) {
    case 'MALICIOUS':
      return 'text-[#C74747]';
    case 'SUSPICIOUS':
      return 'text-[#C58A35]';
    case 'LOW_RISK':
      return 'text-[#27845A]';
    case 'UNKNOWN':
    default:
      return 'text-[#64748B]';
  }
}

export function getRiskBgColor(verdict: string): string {
  switch (verdict) {
    case 'MALICIOUS':
      return 'bg-[#C74747]/10 border-[#C74747]/25';
    case 'SUSPICIOUS':
      return 'bg-[#C58A35]/10 border-[#C58A35]/25';
    case 'LOW_RISK':
      return 'bg-[#27845A]/10 border-[#27845A]/25';
    case 'UNKNOWN':
    default:
      return 'bg-slate-100 border-[#E5E9ED]';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'submitted':
      return 'text-[#477B9B]';
    case 'triaged':
      return 'text-[#315E63]';
    case 'investigating':
      return 'text-[#C58A35]';
    case 'resolved':
      return 'text-[#27845A]';
    case 'closed':
      return 'text-[#64748B]';
    default:
      return 'text-[#64748B]';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'submitted':
      return 'Submitted';
    case 'triaged':
      return 'Triaged';
    case 'investigating':
      return 'Investigating';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function formatDate(date?: string | null): string {
  if (!date) return 'Recently';
  // Normalize string: e.g. "2026-10-30 16:30:00" -> "2026-10-30T16:30:00"
  const cleanDate = typeof date === 'string' ? date.replace(' ', 'T') : date;
  const d = new Date(cleanDate);
  if (isNaN(d.getTime())) return 'Recently';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function truncateUrl(url: string, max: number = 45): string {
  if (url.length <= max) {
    return url;
  }
  const cleaned = url.replace(/^https?:\/\//, '');
  if (cleaned.length <= max) {
    return cleaned;
  }
  return cleaned.substring(0, max - 3) + '...';
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-[#C74747]';
    case 'high':
      return 'text-[#C58A35]';
    case 'medium':
      return 'text-[#C58A35]';
    case 'low':
      return 'text-[#27845A]';
    default:
      return 'text-[#64748B]';
  }
}

export function getRiskIcon(verdict: string): string {
  switch (verdict) {
    case 'MALICIOUS':
      return 'ShieldAlert';
    case 'SUSPICIOUS':
      return 'AlertTriangle';
    case 'LOW_RISK':
      return 'ShieldCheck';
    case 'UNKNOWN':
    default:
      return 'HelpCircle';
  }
}

export function getScorePercentage(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}
