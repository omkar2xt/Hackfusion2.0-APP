export type IncidentCategory =
  | 'phishing'
  | 'malware'
  | 'data_breach'
  | 'unauthorized_access'
  | 'suspicious_email'
  | 'social_engineering'
  | 'other';

export type IncidentStatus =
  | 'submitted'
  | 'triaged'
  | 'investigating'
  | 'resolved'
  | 'closed';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  campus: string;
  role: string;
  created_at: string;
}

export interface ScanResult {
  scan_id: string;
  verdict: 'CONFIRMED_MALICIOUS' | 'MALICIOUS' | 'SUSPICIOUS' | 'LOW_RISK' | 'UNKNOWN';
  risk_level: string;
  risk_score: number;
  scoring_version: string;
  indicators: string[];
  recommendations: string[];
  checked_at: string;
  input_type: 'url' | 'message' | 'qr';
  input_value: string;
}

export interface Incident {
  id: string;
  user_id: string;
  category: IncidentCategory;
  description: string;
  suspicious_content: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
  resolution_notes: string;
}

export interface DashboardStats {
  total_scans: number;
  suspicious_results: number;
  reported_incidents: number;
  recent_scans: ScanResult[];
  recent_incidents: Incident[];
}

export interface ApiError {
  detail: string;
  status_code: number;
}

export interface ScanUrlRequest {
  url: string;
}

export interface ScanMessageRequest {
  message_text: string;
}

export interface ScanQrRequest {
  decoded_content: string;
}

export interface CreateIncidentRequest {
  category: IncidentCategory;
  description: string;
  suspicious_content?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  idempotency_key?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ==========================================
// INNOVATION FEATURES 1-10 TYPES
// ==========================================

// Feature 1: Threat DNA
export interface ThreatFingerprint {
  id: string;
  incident_id?: string;
  fingerprint_hash: string;
  normalized_domain?: string;
  url_structure?: string;
  keywords: string[];
  claimed_sender?: string;
  payment_flags: boolean;
  brand_impersonation?: string;
  campaign_id?: string;
  created_at: string;
}

export interface ThreatCampaign {
  id: string;
  name: string;
  status: 'active' | 'mitigated' | 'monitoring' | 'dismissed';
  incident_count: number;
  risk_score: number;
  common_indicators: string[];
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// Feature 2 & 3: Cyber Radar & Exposure Intelligence
export interface CyberRadarOverview {
  threat_level: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  total_threats: number;
  scans_last_7_days: number;
  incidents_last_7_days: number;
  severity_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  trend_last_7_days: Array<{
    date: string;
    scans: number;
    incidents: number;
  }>;
}

export interface DepartmentExposurePattern {
  department: string;
  threat_types: string[];
  sample_size: number;
  guidance: string;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ExposureIntelligence {
  data_sufficiency_met: boolean;
  total_incidents_analyzed: number;
  minimum_threshold: number;
  explanation: string;
  department_patterns: DepartmentExposurePattern[];
  general_recommendations: string[];
}

// Feature 4: QR Guardian
export interface VerifiedQrDestination {
  id: string;
  title: string;
  destination_pattern: string;
  department: string;
  location_notes?: string;
  is_active: boolean;
}

export interface QrAnalysisResult {
  raw_qr_content: string;
  is_verified: boolean;
  matched_title?: string;
  matched_department?: string;
  badge: 'OFFICIAL_CAMPUS' | 'UNVERIFIED_EXTERNAL' | 'SUSPICIOUS_MALICIOUS';
  verdict: 'CONFIRMED_MALICIOUS' | 'SUSPICIOUS' | 'LOW_RISK' | 'UNKNOWN';
  risk_score: number;
  indicators: string[];
  recommendations: string[];
}

// Feature 6: Institutional Trust Graph
export interface InstitutionalIdentity {
  id: string;
  unit_name: string;
  official_domain: string;
  official_email_patterns: string[];
  department: string;
  is_verified: boolean;
}

export interface TrustVerificationResult {
  claimed_sender: string;
  sender_domain?: string;
  trust_status: 'VERIFIED_OFFICIAL' | 'LOOKALIKE_IMPERSONATION' | 'UNVERIFIED';
  matched_unit?: string;
  is_legitimate: boolean;
  alert?: string;
  guidance: string;
}

// Feature 7: Campus Immune System Warnings
export interface CampusWarning {
  id: string;
  campaign_id?: string;
  title: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  is_active: boolean;
  created_at: string;
}

// Feature 8: Offline Cyber Safety Mode
export interface OfflineIncidentDraft {
  local_id: string;
  idempotency_key: string;
  category: IncidentCategory;
  description: string;
  suspicious_content?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
  synced: boolean;
}

// Feature 9: Evidence Timeline & Export
export interface TimelineEvent {
  id: string;
  incident_id: string;
  event_type: string;
  actor: string;
  details: string;
  timestamp: string;
}

export interface EvidenceExportPackage {
  incident: Incident;
  timeline: TimelineEvent[];
  exported_at: string;
  exported_by: string;
  digital_signature: {
    algorithm: string;
    hash: string;
    verification_standard: string;
  };
}

// Feature 10: Adaptive Cyber Safety Coach
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index?: number;
  explanation: string;
}

export interface LearningModule {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  read_time_minutes: number;
  content_markdown: string;
  points_reward: number;
  badge_reward: string;
  questions: QuizQuestion[];
}

export interface QuizSubmissionResponse {
  module_slug: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  badge_awarded?: string;
  feedback: string;
}

export interface LearningProgress {
  user_id: string;
  total_score: number;
  security_level: string;
  badges: string[];
  completed_module_slugs: string[];
}
