export function getRiskColor(verdict: string): string {
  switch (verdict) {
    case 'MALICIOUS':
      return 'text-red-500';
    case 'SUSPICIOUS':
      return 'text-amber-500';
    case 'LOW_RISK':
      return 'text-teal-400';
    case 'UNKNOWN':
    default:
      return 'text-gray-400';
  }
}

export function getRiskBgColor(verdict: string): string {
  switch (verdict) {
    case 'MALICIOUS':
      return 'bg-red-500/20 border-red-500/40';
    case 'SUSPICIOUS':
      return 'bg-amber-500/20 border-amber-500/40';
    case 'LOW_RISK':
      return 'bg-teal-500/20 border-teal-500/40';
    case 'UNKNOWN':
    default:
      return 'bg-gray-500/20 border-gray-500/40';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'submitted':
      return 'text-blue-400';
    case 'triaged':
      return 'text-cyan-400';
    case 'investigating':
      return 'text-amber-400';
    case 'resolved':
      return 'text-teal-400';
    case 'closed':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
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

export function formatDate(date: string): string {
  const d = new Date(date);
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
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    case 'medium':
      return 'text-amber-400';
    case 'low':
      return 'text-teal-400';
    default:
      return 'text-gray-400';
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
