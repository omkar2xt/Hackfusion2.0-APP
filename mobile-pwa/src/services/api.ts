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
} from '../types';

class ApiService {
  private baseUrl: string;

  constructor() {
    const envBase = import.meta.env.VITE_API_BASE_URL;
    if (envBase !== undefined && envBase !== '') {
      this.baseUrl = envBase.replace(/\/+$/, '');
    } else {
      // In development with Vite dev proxy, empty string routes requests same-origin to Vite proxy
      this.baseUrl = import.meta.env.DEV ? '' : 'http://127.0.0.1:8000';
    }
  }

  private getToken(): string | null {
    const raw = localStorage.getItem('sb-auth-token');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed.access_token || null;
    } catch {
      return raw;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
    } catch (networkError: any) {
      clearTimeout(timeoutId);
      if (networkError.name === 'AbortError') {
        const error = new Error(`Request to ${endpoint} timed out after 10s`) as Error & { statusCode: number };
        error.statusCode = 408;
        throw error;
      }
      const error = new Error(`Cannot connect to backend server at ${this.baseUrl}. Please ensure the FastAPI server is running.`) as Error & { statusCode: number };
      error.statusCode = 503;
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let errorDetail: string;
      try {
        const errorBody: ApiError = await response.json();
        errorDetail = errorBody.detail || `Request failed with status ${response.status}`;
      } catch {
        errorDetail = `Request failed with status ${response.status}: ${response.statusText}`;
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
  async analyzeQrGuardian(data: { raw_qr_content: string }): Promise<QrAnalysisResult> {
    return this.request<QrAnalysisResult>('/api/v1/qr/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
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
}

export const api = new ApiService();
