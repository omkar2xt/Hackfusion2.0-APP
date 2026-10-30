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

export interface ConnectedScanInfo {
  scan_id?: string | null;
  input_value: string;
  verdict: string;
  risk_level: string;
  risk_score: number;
  indicators: string[];
  recommendations: string[];
  checked_at?: string | null;
}

export interface IStepsInsights {
  malicious_url_detected: boolean;
  malicious_attachment_detected: boolean;
  malicious_call_to_action_detected: boolean;
  suspicious_headers_or_impersonation: boolean;
  target_audience: string;
  attack_vector: string;
  analyst_assigned: string;
  containment_status: string;
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
  connected_scan?: ConnectedScanInfo;
  isteps_insights?: IStepsInsights;
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
export interface CampusZoneTelemetry {
  id: string;
  name: string;
  code: string;
  category: string;
  threat_level: 'RED_ALERT' | 'ELEVATED' | 'NORMAL';
  active_threats: number;
  reported_incidents_today: number;
  radius_meters: number;
  proximity_alert_active: boolean;
  last_reported_attack: string;
  top_threat_vector: string;
  x_percent: number;
  y_percent: number;
}

export interface ThreatFeedEvent {
  id: string;
  timestamp_display: string;
  campus_zone: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  threat_vector: string;
  anonymized_reporter: string; // Zero PII: e.g. "Student #4A8F"
  status: string;
  distance_meters?: number;
}

export interface ProximityAlertBroadcast {
  id: string;
  zone_id: string;
  zone_name: string;
  severity: string;
  alert_title: string;
  alert_message: string;
  created_at: string;
  expires_in_minutes: number;
  active: boolean;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface SeverityStat {
  severity: string;
  count: number;
  color: string;
}

export interface CyberRadarOverview {
  threat_level: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  total_threats: number;
  total_incidents?: number;
  live_attacks_count?: number;
  critical_alerts_count?: number;
  blocked_traffic_count?: number;
  phishing_count?: number;
  qr_threats_count?: number;
  impersonation_count?: number;
  payment_fraud_count?: number;
  categories?: CategoryStat[];
  severities?: SeverityStat[];
  scans_last_7_days?: number;
  incidents_last_7_days?: number;
  severity_distribution?: Record<string, number>;
  category_distribution?: Record<string, number>;
  trends?: Array<{
    date: string;
    incidents: number;
    scans: number;
  }>;
  trend_last_7_days?: Array<{
    date: string;
    scans: number;
    incidents: number;
  }>;
  campus_zones?: CampusZoneTelemetry[];
  realtime_threat_feed?: ThreatFeedEvent[];
  active_proximity_alerts?: ProximityAlertBroadcast[];
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
  name?: string;
  unit_name?: string;
  role_title?: string;
  official_domain?: string;
  verified_domain?: string;
  official_email?: string;
  official_phone?: string;
  official_email_patterns?: string[];
  department: string;
  official_portal_url?: string;
  verified_payment_portal?: string;
  is_verified?: boolean;
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
  actor?: string;
  actor_id?: string;
  details?: string;
  description?: string;
  timestamp?: string;
  created_at?: string;
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

// Emergency Red Alert Broadcast & Authenticated Device Relay
export interface EmergencyAlert {
  id: string;
  institution_id: string;
  campus_id: string;
  department_id?: string;
  target_zone: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'ADVISORY';
  title: string;
  message: string;
  action_instructions: string;
  status: 'DRAFT' | 'APPROVED' | 'SENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  delivery_scope: 'PROXIMITY_MESH' | 'CAMPUS_WIDE' | 'INSTITUTION_WIDE' | 'DEPARTMENT_ONLY';
  target_device_count: number;
  acknowledged_count: number;
  broadcast_by: string;
  broadcast_by_role: string;
  is_acknowledged?: boolean;
  expires_at?: string;
  created_at: string;
}

export interface BroadcastAlertPayload {
  target_zone: string;
  category: string;
  title?: string;
  message: string;
  severity?: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'ADVISORY';
  action_instructions?: string;
  delivery_scope?: 'PROXIMITY_MESH' | 'CAMPUS_WIDE' | 'INSTITUTION_WIDE' | 'DEPARTMENT_ONLY';
  expires_in_hours?: number;
}

export interface DeviceRegistration {
  id: string;
  user_id: string;
  institution_id: string;
  campus_id: string;
  department_id: string;
  device_platform: 'ios' | 'android' | 'web_pwa' | 'desktop_chrome' | 'macos' | 'windows';
  device_name: string;
  proximity_zone: string;
  push_token?: string;
  is_active: boolean;
  last_active_at: string;
  registered_at: string;
}

export interface RegisterDevicePayload {
  device_id?: string;
  device_platform?: string;
  device_name: string;
  proximity_zone?: string;
  push_token?: string;
}

export interface AlertDeliveryMetric {
  total_targeted: number;
  delivered: number;
  acknowledged: number;
  pending: number;
  by_platform: Record<string, number>;
  deliveries_sample: Array<{
    device_id: string;
    status: string;
    acknowledged_at?: string;
  }>;
}

export interface UserGroup {
  id: string;
  department_id: string;
  name: string;
  role_type: string;
  description: string;
}

export interface DepartmentNode {
  id: string;
  campus_id: string;
  name: string;
  code: string;
  head_of_department: string;
  user_groups: UserGroup[];
  device_count: number;
}

export interface CampusNode {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  location: string;
  departments: DepartmentNode[];
}

export interface InstitutionTree {
  id: string;
  name: string;
  code: string;
  domain: string;
  campuses: CampusNode[];
  total_devices: number;
  total_alerts_active: number;
}

export interface CampusBuilding {
  id: string;
  name: string;
  code: string;
  building_type: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  description: string;
  contact_lead?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GeofenceAlert {
  zone_id: string;
  zone_name: string;
  threat_level: string;
  distance_meters: number;
  is_inside: boolean;
  is_approaching: boolean;
  warning_message: string;
  top_threat_vector?: string;
}

export interface GeofenceCheckResponse {
  user_latitude: number;
  user_longitude: number;
  timestamp: string;
  in_campus_bounds: boolean;
  closest_building_id?: string | null;
  closest_building_name?: string | null;
  closest_building_distance_meters?: number | null;
  alerts: GeofenceAlert[];
}

// --- PART 4: Advanced Cyber Investigation & Threat Intelligence ---
export interface TechnicalIndicator {
  name: string;
  category: string;
  evidence_source: string;
  timestamp: string;
  status: 'CONFIRMED' | 'INFERRED' | 'UNVERIFIED' | 'SUSPICIOUS';
  details: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export interface DnsRecordInfo {
  record_type: string;
  value: string;
  ttl?: number;
}

export interface TlsCertificateInfo {
  subject: string;
  issuer: string;
  valid_from?: string;
  valid_to?: string;
  fingerprint_sha256: string;
  is_valid: boolean;
  cipher_suite?: string;
}

export interface InfrastructureIntel {
  domain: string;
  ip_addresses: string[];
  asn?: string;
  asn_org?: string;
  hosting_provider?: string;
  country?: string;
  dns_records: DnsRecordInfo[];
  tls_certificate?: TlsCertificateInfo;
  redirect_chain: string[];
  is_url_shortener: boolean;
  unpacked_destination?: string;
}

export interface UrlInvestigationResponse {
  normalized_url: string;
  scheme: string;
  hostname: string;
  port?: number | null;
  path: string;
  query_params: Record<string, string>;
  verdict: 'CONFIRMED_MALICIOUS' | 'SUSPICIOUS' | 'UNDER_INVESTIGATION' | 'LOW_RISK' | 'UNKNOWN';
  risk_score: number;
  severity: string;
  evidence_confidence: string;
  potential_impact: string;
  infrastructure: InfrastructureIntel;
  indicators: TechnicalIndicator[];
  typosquatting_target?: string | null;
  credential_harvesting_detected: boolean;
  ssrf_safe: boolean;
  ssrf_note?: string | null;
  investigated_at: string;
}

export interface QrInvestigationResponse {
  decoded_payload: string;
  payload_type: 'URL' | 'WIFI' | 'PAYMENT' | 'VCARD_CONTACT' | 'TEXT_PLAIN' | 'APP_DEEP_LINK';
  payload_hash_sha256: string;
  image_hash_sha256?: string | null;
  verdict: 'CONFIRMED_MALICIOUS' | 'SUSPICIOUS' | 'UNDER_INVESTIGATION' | 'LOW_RISK' | 'UNKNOWN';
  risk_score: number;
  severity: string;
  evidence_confidence: string;
  potential_impact: string;
  url_destination?: string | null;
  url_investigation?: UrlInvestigationResponse | null;
  wifi_config?: Record<string, string> | null;
  payment_info?: Record<string, string> | null;
  contact_info?: Record<string, string> | null;
  indicators: TechnicalIndicator[];
  reuse_count_across_campus: number;
  related_incident_ids: string[];
  security_explanation: string;
  investigated_at: string;
}

export interface AttributionItem {
  observed_facts: string[];
  technical_inferences: string[];
  unverified_hypotheses: string[];
  confirmed_findings: string[];
  source_ip?: string | null;
  destination_ip?: string | null;
  source_port?: number | null;
  destination_port?: number | null;
  protocol?: string | null;
  timestamp_with_tz: string;
  session_id?: string | null;
  user_agent?: string | null;
  network_provider?: string | null;
  attribution_confidence: string;
  attribution_disclaimer: string;
}

export interface EvidenceVaultItem {
  id: string;
  incident_id?: string | null;
  evidence_type: string;
  file_hash_sha256: string;
  raw_payload_preview: string;
  source_origin: string;
  uploaded_by: string;
  chain_of_custody: Array<{ timestamp: string; action: string; user: string }>;
  created_at: string;
}

export interface IncidentCorrelationItem {
  incident_id: string;
  related_incident_id: string;
  correlation_factor: string;
  match_strength: 'CONFIRMED_MATCH' | 'WEAK_SIMILARITY';
  shared_indicator: string;
  reason: string;
}

export interface VictimImpactSummary {
  total_affected_reports: number;
  potentially_exposed_accounts: number;
  credential_submissions_reported: number;
  affected_departments: string[];
  affected_device_count: number;
  assessment_note: string;
}

export interface InvestigationReport {
  report_id: string;
  incident_id: string;
  incident_title: string;
  generated_at: string;
  incident_summary: string;
  attack_type: string;
  timeline: Array<{ timestamp: string; stage: string; event: string }>;
  url_or_qr_analysis: Record<string, any>;
  technical_indicators: TechnicalIndicator[];
  infrastructure?: InfrastructureIntel | null;
  affected_users_and_systems: VictimImpactSummary;
  evidence_vault_references: string[];
  related_incidents: string[];
  attribution: AttributionItem;
  recommended_containment_steps: string[];
  investigation_status: string;
}



