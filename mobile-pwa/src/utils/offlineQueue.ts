import type { OfflineIncidentDraft, CreateIncidentRequest, ScanResult } from '../types';
import { api } from '../services/api';

const OFFLINE_QUEUE_KEY = 'signalsafe_offline_incident_queue';

export function getOfflineIncidents(): OfflineIncidentDraft[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOfflineIncident(draft: Omit<OfflineIncidentDraft, 'local_id' | 'idempotency_key' | 'created_at' | 'synced'>): OfflineIncidentDraft {
  const incidents = getOfflineIncidents();
  const newDraft: OfflineIncidentDraft = {
    ...draft,
    local_id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    idempotency_key: `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString(),
    synced: false,
  };
  incidents.unshift(newDraft);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(incidents));
  return newDraft;
}

export function removeOfflineIncident(localId: string): void {
  const incidents = getOfflineIncidents().filter(item => item.local_id !== localId);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(incidents));
}

export async function syncOfflineIncidents(): Promise<{ synced: number; failed: number }> {
  const incidents = getOfflineIncidents();
  let synced = 0;
  let failed = 0;

  for (const item of incidents) {
    if (item.synced) continue;
    try {
      const payload: CreateIncidentRequest = {
        category: item.category,
        description: item.description,
        suspicious_content: item.suspicious_content,
        severity: item.severity,
        idempotency_key: item.idempotency_key,
      };
      await api.createIncident(payload);
      item.synced = true;
      synced++;
    } catch {
      failed++;
    }
  }

  // Remove all synced items
  const remaining = incidents.filter(i => !i.synced);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));

  return { synced, failed };
}

// Local Offline Heuristic Analyzer (Feature 8)
export function runOfflineHeuristicScan(type: 'url' | 'message', content: string): ScanResult {
  const indicators: string[] = [];
  const recommendations: string[] = [];
  let score = 5;

  if (type === 'url') {
    const lower = content.toLowerCase();
    if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lower)) {
      indicators.push('Raw numeric IP address used instead of reputable campus domain');
      score += 45;
    }
    if (lower.includes(':8080') || lower.includes(':8888') || lower.includes(':5000')) {
      indicators.push('Non-standard server port in link URL');
      score += 20;
    }
    if (lower.includes('verify') || lower.includes('update') || lower.includes('bursar') || lower.includes('password') || lower.includes('refund')) {
      indicators.push('High-risk security keywords in link');
      score += 20;
    }
    if (lower.endsWith('.xyz') || lower.endsWith('.top') || lower.endsWith('.tk') || lower.endsWith('.info')) {
      indicators.push('Uncommon high-risk top-level domain (.xyz, .top, .info)');
      score += 25;
    }
  } else {
    const lower = content.toLowerCase();
    if (lower.includes('urgent') || lower.includes('immediately') || lower.includes('suspended') || lower.includes('within 24 hours')) {
      indicators.push('Artificial urgency and deadline coercion detected');
      score += 35;
    }
    if (lower.includes('gift card') || lower.includes('wire transfer') || lower.includes('crypto') || lower.includes('fee payment')) {
      indicators.push('Irregular financial or untraceable payment method requested');
      score += 40;
    }
    if (lower.includes('verify your password') || lower.includes('click to confirm account')) {
      indicators.push('Credential harvesting pattern detected');
      score += 30;
    }
  }

  score = Math.min(100, Math.max(0, score));

  let verdict: ScanResult['verdict'] = 'LOW_RISK';
  let risk_level = 'LOW';
  if (score >= 80) {
    verdict = 'CONFIRMED_MALICIOUS';
    risk_level = 'CRITICAL';
    recommendations.push('Do NOT click this link or respond to this message.');
    recommendations.push('Forward this message to campus security administrators immediately.');
  } else if (score >= 50) {
    verdict = 'SUSPICIOUS';
    risk_level = 'HIGH';
    recommendations.push('Exercise strong caution. Check the official sender address.');
  } else if (score >= 20) {
    verdict = 'SUSPICIOUS';
    risk_level = 'MEDIUM';
    recommendations.push('Unusual characteristics detected; verify with the claimed department directly.');
  } else {
    verdict = 'LOW_RISK';
    risk_level = 'LOW';
    recommendations.push('No obvious threat indicators detected in offline heuristic database.');
  }

  return {
    scan_id: `offline_${Date.now()}`,
    verdict,
    risk_level,
    risk_score: score,
    scoring_version: '2.0-offline-heuristic',
    indicators: indicators.length > 0 ? indicators : ['No immediate threat indicators identified'],
    recommendations,
    checked_at: new Date().toISOString(),
    input_type: type,
    input_value: content,
  };
}
