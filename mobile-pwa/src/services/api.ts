import type {
  ScanResult,
  ScanUrlRequest,
  ScanMessageRequest,
  ScanQrRequest,
  Incident,
  CreateIncidentRequest,
  DashboardStats,
  User,
  ApiError,
  ThreatFingerprint,
  ThreatCampaign,
  CyberRadarOverview,
  ExposureIntelligence,
  VerifiedQrDestination,
  QrAnalysisResult,
  InstitutionalIdentity,
  TrustVerificationResult,
  CampusWarning,
  TimelineEvent,
  EvidenceExportPackage,
  LearningModule,
  QuizSubmissionResponse,
  LearningProgress,
  EmergencyAlert,
  BroadcastAlertPayload,
  DeviceRegistration,
  RegisterDevicePayload,
  AlertDeliveryMetric,
  InstitutionTree,
  CampusBuilding,
  GeofenceCheckResponse,
  UrlInvestigationResponse,
  QrInvestigationResponse,
  EvidenceVaultItem,
  IncidentCorrelationItem,
  AttributionItem,
  InvestigationReport,
  UserProfile,
  UserProfileUpdate,
  UserSession,
  RolePermissionMatrix,
  AuditLog,
} from '../types';

export const DEFAULT_PRODUCTION_RENDER_URL = 'https://hackfusion2-0-app.onrender.com';

export type NetworkStatus = 'online' | 'offline' | 'connecting';

class ApiService {
  private baseUrl: string;
  private statusListeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = 'online';

  constructor() {
    const customEndpoint =
      typeof window !== 'undefined' ? localStorage.getItem('yodhra_custom_api_url') : null;
    const envBase = import.meta.env.VITE_API_BASE_URL;

    if (customEndpoint && customEndpoint.trim() !== '') {
      this.baseUrl = customEndpoint.trim().replace(/\/+$/, '');
    } else if (envBase !== undefined && envBase.trim() !== '') {
      this.baseUrl = envBase.trim().replace(/\/+$/, '');
    } else if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      // Native Android APK: default to cloud production endpoint (overridable in app settings)
      this.baseUrl = DEFAULT_PRODUCTION_RENDER_URL;
    } else if (import.meta.env.DEV) {
      // Local dev mode: Vite proxy routes '' to http://127.0.0.1:8000
      this.baseUrl = '';
    } else {
      // Production Web (Vercel): default to deployed Render backend
      this.baseUrl = DEFAULT_PRODUCTION_RENDER_URL;
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined') {
      localStorage.setItem('yodhra_custom_api_url', this.baseUrl);
    }
  }

  public onStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.currentStatus);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private setStatus(status: NetworkStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.statusListeners.forEach((listener) => listener(status));
    }
  }

  public async checkHealth(): Promise<boolean> {
    try {
      this.setStatus('connecting');
      const res = await this.request<{ status: string }>('/api/v1/health', {
        method: 'GET',
      });
      const ok = res && (res.status === 'healthy' || res.status === 'degraded');
      this.setStatus(ok ? 'online' : 'offline');
      return ok;
    } catch {
      this.setStatus('offline');
      return false;
    }
  }

  // --- App Distribution & Version Updates ---
  async getAppVersion(): Promise<any> {
    return this.request<any>('/api/v1/app/version', {
      method: 'GET',
    });
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;

    // 1. Direct token storage key
    const raw = localStorage.getItem('sb-auth-token');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.access_token) return parsed.access_token;
      } catch {
        return raw;
      }
    }

    // 2. Standard Supabase SDK project token: sb-<project-ref>-auth-token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (parsed.access_token) return parsed.access_token;
          } catch {
            // continue
          }
        }
      }
    }

    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Render cloud cold starts can take 20-35s. Timeout set to 35s.
    const REQUEST_TIMEOUT_MS = 35000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
      this.setStatus('online');
    } catch (networkError: any) {
      clearTimeout(timeoutId);

      // Handle retry for idempotent GET requests during cold-start or momentary glitch
      const isGet = !options.method || options.method.toUpperCase() === 'GET';
      if (isGet && retryCount < 1) {
        this.setStatus('connecting');
        await new Promise((res) => setTimeout(res, 2000));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      this.setStatus('offline');
      if (networkError.name === 'AbortError') {
        const error = new Error(
          `Request to ${endpoint} timed out after ${REQUEST_TIMEOUT_MS / 1000}s. The backend server (Render) may be waking up from sleep. Please try again.`
        ) as Error & { statusCode: number };
        error.statusCode = 408;
        throw error;
      }
      const displayUrl = this.baseUrl || 'local dev proxy';
      const error = new Error(
        `Cannot connect to backend server at ${displayUrl}. Please ensure the Render service is running.`
      ) as Error & { statusCode: number };
      error.statusCode = 503;
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    // If server responded with 502/503 during cold-start warmup, retry idempotent GET once
    if (
      (response.status === 502 || response.status === 503) &&
      retryCount < 1 &&
      (!options.method || options.method.toUpperCase() === 'GET')
    ) {
      this.setStatus('connecting');
      await new Promise((res) => setTimeout(res, 3000));
      return this.request<T>(endpoint, options, retryCount + 1);
    }

    if (!response.ok) {
      let errorDetail: string;
      try {
        const errorBody: ApiError = await response.json();
        errorDetail = errorBody.detail || `Request failed with status ${response.status}`;
      } catch {
        errorDetail = `Request failed with status ${response.status}: ${response.statusText}`;
      }

      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('yodhra:auth:unauthorized'));
      }

      const error = new Error(errorDetail) as Error & { statusCode: number };
      error.statusCode = response.status;
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  // --- Core Scans ---
  async scanUrl(data: ScanUrlRequest): Promise<ScanResult> {
    return this.request<ScanResult>('/api/v1/scan/url', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scanMessage(data: ScanMessageRequest): Promise<ScanResult> {
    return this.request<ScanResult>('/api/v1/scan/message', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scanQr(data: ScanQrRequest): Promise<ScanResult> {
    return this.request<ScanResult>('/api/v1/scan/qr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Incidents ---
  async createIncident(data: CreateIncidentRequest): Promise<Incident> {
    return this.request<Incident>('/api/v1/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getIncidents(): Promise<Incident[]> {
    return this.request<Incident[]>('/api/v1/incidents', {
      method: 'GET',
    });
  }

  async getIncident(id: string): Promise<Incident> {
    return this.request<Incident>(`/api/v1/incidents/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  }

  async updateIncidentStatus(
    id: string,
    data: { status?: string; severity?: string; resolution_notes?: string }
  ): Promise<Incident> {
    return this.request<Incident>(`/api/v1/incidents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async quarantineIncident(id: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(`/api/v1/incidents/${encodeURIComponent(id)}/actions/quarantine`, {
      method: 'POST',
    });
  }

  // --- Dashboard & Profile ---
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/v1/dashboard/stats', {
      method: 'GET',
    });
  }

  async getUserProfile(): Promise<User> {
    return this.request<User>('/api/v1/users/me', {
      method: 'GET',
    });
  }

  async updateUserProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- Feature 1: Threat DNA Engine ---
  async analyzeThreatDna(data: { raw_content: string; content_type: string; sender?: string }): Promise<ThreatFingerprint> {
    return this.request<ThreatFingerprint>('/api/v1/threat-dna/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getThreatCampaigns(): Promise<ThreatCampaign[]> {
    return this.request<ThreatCampaign[]>('/api/v1/threat-dna/campaigns', {
      method: 'GET',
    });
  }

  async getThreatCampaign(id: string): Promise<ThreatCampaign> {
    return this.request<ThreatCampaign>(`/api/v1/threat-dna/campaigns/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  }

  // --- Feature 2 & 3: Cyber Radar & Exposure Intelligence ---
  async getCyberRadarOverview(): Promise<CyberRadarOverview> {
    return this.request<CyberRadarOverview>('/api/v1/cyber-radar/overview', {
      method: 'GET',
    });
  }

  async getExposureIntelligence(): Promise<ExposureIntelligence> {
    return this.request<ExposureIntelligence>('/api/v1/cyber-radar/exposure', {
      method: 'GET',
    });
  }

  async getProximityAlerts(): Promise<any[]> {
    return this.request<any[]>('/api/v1/cyber-radar/proximity-alerts', {
      method: 'GET',
    });
  }

  async broadcastProximityAlert(data: {
    zone_id: string;
    category: string;
    severity?: string;
    message: string;
  }): Promise<any> {
    return this.request<any>('/api/v1/cyber-radar/broadcast-alert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Feature 4: QR Guardian ---
  async analyzeQrGuardian(data: { raw_qr_content?: string; decoded_content?: string }): Promise<QrAnalysisResult> {
    const content = data.decoded_content || data.raw_qr_content || '';
    return this.request<QrAnalysisResult>('/api/v1/qr/analyze', {
      method: 'POST',
      body: JSON.stringify({ decoded_content: content }),
    });
  }

  async getVerifiedQrDestinations(): Promise<VerifiedQrDestination[]> {
    return this.request<VerifiedQrDestination[]>('/api/v1/qr/verified-destinations', {
      method: 'GET',
    });
  }

  // --- Feature 6: Institutional Trust Graph ---
  async getInstitutionalIdentities(): Promise<InstitutionalIdentity[]> {
    return this.request<InstitutionalIdentity[]>('/api/v1/trust-graph/identities', {
      method: 'GET',
    });
  }

  async verifyTrustGraph(data: { claimed_sender: string; sender_domain?: string }): Promise<TrustVerificationResult> {
    return this.request<TrustVerificationResult>('/api/v1/trust-graph/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Feature 7: Campus Cyber Immune System ---
  async getCampusWarnings(): Promise<CampusWarning[]> {
    return this.request<CampusWarning[]>('/api/v1/immune/warnings', {
      method: 'GET',
    });
  }

  // --- Feature 9: Evidence Timeline & Export ---
  async getIncidentTimeline(incidentId: string): Promise<TimelineEvent[]> {
    return this.request<TimelineEvent[]>(`/api/v1/incidents/${encodeURIComponent(incidentId)}/timeline`, {
      method: 'GET',
    });
  }

  async exportIncidentEvidence(incidentId: string): Promise<EvidenceExportPackage> {
    return this.request<EvidenceExportPackage>(`/api/v1/incidents/${encodeURIComponent(incidentId)}/export`, {
      method: 'GET',
    });
  }

  // --- Feature 10: Adaptive Cyber Safety Coach ---
  async getLearningModules(): Promise<LearningModule[]> {
    return this.request<LearningModule[]>('/api/v1/coach/modules', {
      method: 'GET',
    });
  }

  async getLearningModule(slug: string): Promise<LearningModule> {
    return this.request<LearningModule>(`/api/v1/coach/modules/${encodeURIComponent(slug)}`, {
      method: 'GET',
    });
  }

  async submitQuiz(data: { module_slug: string; answers: Record<string, number> }): Promise<QuizSubmissionResponse> {
    return this.request<QuizSubmissionResponse>('/api/v1/coach/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLearningProgress(): Promise<LearningProgress> {
    return this.request<LearningProgress>('/api/v1/coach/progress', {
      method: 'GET',
    });
  }

  // --- PART 3: Emergency Red Alert Broadcast & Authenticated Device Relay ---
  async getActiveEmergencyAlerts(deviceId?: string): Promise<EmergencyAlert[]> {
    const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
    return this.request<EmergencyAlert[]>(`/api/v1/alerts/active${query}`, {
      method: 'GET',
    });
  }

  async broadcastEmergencyAlert(data: BroadcastAlertPayload): Promise<EmergencyAlert> {
    return this.request<EmergencyAlert>('/api/v1/alerts/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async acknowledgeEmergencyAlert(
    alertId: string,
    deviceId: string,
    userNotes?: string
  ): Promise<{ success: boolean; alert_id: string; ack_hash: string; total_acknowledged: number }> {
    return this.request<{ success: boolean; alert_id: string; ack_hash: string; total_acknowledged: number }>(
      `/api/v1/alerts/${encodeURIComponent(alertId)}/acknowledge`,
      {
        method: 'POST',
        body: JSON.stringify({ device_id: deviceId, user_notes: userNotes }),
      }
    );
  }

  async getAlertDeliveries(alertId: string): Promise<AlertDeliveryMetric> {
    return this.request<AlertDeliveryMetric>(
      `/api/v1/alerts/${encodeURIComponent(alertId)}/deliveries`,
      {
        method: 'GET',
      }
    );
  }

  async getAlertMetrics(alertId: string): Promise<AlertDeliveryMetric> {
    return this.getAlertDeliveries(alertId);
  }

  async acknowledgeAlert(
    alertId: string,
    data?: { client_timestamp?: string; device_id?: string; user_notes?: string }
  ): Promise<{ success: boolean; alert_id: string; ack_hash: string; total_acknowledged: number }> {
    return this.acknowledgeEmergencyAlert(
      alertId,
      data?.device_id || localStorage.getItem('signalsafe_device_id') || 'web_terminal',
      data?.user_notes
    );
  }

  async registerDevice(data: RegisterDevicePayload): Promise<DeviceRegistration> {
    return this.request<DeviceRegistration>('/api/v1/devices/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserDevices(): Promise<DeviceRegistration[]> {
    return this.request<DeviceRegistration[]>('/api/v1/devices', {
      method: 'GET',
    });
  }

  async revokeDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/api/v1/devices/${encodeURIComponent(deviceId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  // --- PART 2: Hierarchical Database Tree Architecture ---
  async getInstitutionalHierarchy(): Promise<InstitutionTree> {
    return this.request<InstitutionTree>('/api/v1/alerts/hierarchy/tree', {
      method: 'GET',
    });
  }

  // --- PART 3: Campus Geospatial Intelligence Radar & Geofencing ---
  async getCampusBuildings(): Promise<CampusBuilding[]> {
    return this.request<CampusBuilding[]>('/api/v1/campus/buildings', {
      method: 'GET',
    });
  }

  async createCampusBuilding(data: Partial<CampusBuilding>): Promise<CampusBuilding> {
    return this.request<CampusBuilding>('/api/v1/campus/buildings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCampusBuilding(buildingId: string, data: Partial<CampusBuilding>): Promise<CampusBuilding> {
    return this.request<CampusBuilding>(`/api/v1/campus/buildings/${encodeURIComponent(buildingId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async checkGeofence(data: { latitude: number; longitude: number; accuracy_meters?: number }): Promise<GeofenceCheckResponse> {
    return this.request<GeofenceCheckResponse>('/api/v1/campus/geofence-check', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- PART 4: Advanced Cyber Investigation & Threat Intelligence ---
  async investigateUrl(url: string, incidentId?: string): Promise<UrlInvestigationResponse> {
    return this.request<UrlInvestigationResponse>('/api/v1/investigation/url', {
      method: 'POST',
      body: JSON.stringify({ url, incident_id: incidentId }),
    });
  }

  async investigateQr(
    decodedPayload: string,
    imageMetadata?: any,
    imageHashSha256?: string,
    incidentId?: string
  ): Promise<QrInvestigationResponse> {
    return this.request<QrInvestigationResponse>('/api/v1/investigation/qr', {
      method: 'POST',
      body: JSON.stringify({
        decoded_payload: decodedPayload,
        image_metadata: imageMetadata,
        image_hash_sha256: imageHashSha256,
        incident_id: incidentId,
      }),
    });
  }

  async getEvidenceVault(): Promise<EvidenceVaultItem[]> {
    return this.request<EvidenceVaultItem[]>('/api/v1/investigation/vault', {
      method: 'GET',
    });
  }

  async depositEvidence(data: {
    incident_id?: string;
    evidence_type: string;
    raw_content: string;
    source_origin?: string;
  }): Promise<EvidenceVaultItem> {
    return this.request<EvidenceVaultItem>('/api/v1/investigation/vault', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getIncidentCorrelations(): Promise<IncidentCorrelationItem[]> {
    return this.request<IncidentCorrelationItem[]>('/api/v1/investigation/correlation', {
      method: 'GET',
    });
  }

  async getIncidentAttribution(incidentId: string): Promise<AttributionItem> {
    return this.request<AttributionItem>(`/api/v1/investigation/attribution/${encodeURIComponent(incidentId)}`, {
      method: 'GET',
    });
  }

  async getInvestigationReport(incidentId: string): Promise<InvestigationReport> {
    return this.request<InvestigationReport>(`/api/v1/investigation/report/${encodeURIComponent(incidentId)}`, {
      method: 'GET',
    });
  }

  // --- PART 5: IAM, Personal Profile, Hierarchy, Sessions & RBAC ---
  async getIamProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/v1/iam/profile', {
      method: 'GET',
    });
  }

  async updateIamProfile(data: UserProfileUpdate): Promise<UserProfile> {
    return this.request<UserProfile>('/api/v1/iam/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/v1/iam/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserSessions(): Promise<UserSession[]> {
    return this.request<UserSession[]>('/api/v1/iam/sessions', {
      method: 'GET',
    });
  }

  async revokeUserSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/v1/iam/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  }

  async getRolePermissionMatrix(): Promise<RolePermissionMatrix> {
    return this.request<RolePermissionMatrix>('/api/v1/iam/roles/matrix', {
      method: 'GET',
    });
  }

  async assignUserRole(data: {
    target_user_id: string;
    target_user_email: string;
    new_role: string;
    reason?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/v1/iam/roles/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/api/v1/iam/audit-logs', {
      method: 'GET',
    });
  }

  async createDepartment(data: {
    campus_id?: string;
    name: string;
    code: string;
    head_of_department: string;
  }): Promise<{ success: boolean; department_id: string; name: string }> {
    return this.request<{ success: boolean; department_id: string; name: string }>('/api/v1/iam/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
