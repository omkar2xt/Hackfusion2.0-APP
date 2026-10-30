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
  verdict: 'MALICIOUS' | 'SUSPICIOUS' | 'LOW_RISK' | 'UNKNOWN';
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
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: User;
}
