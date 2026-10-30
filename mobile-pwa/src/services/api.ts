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
} from '../types';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';
    this.baseUrl = this.baseUrl.replace(/\/+$/, '');
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
}

export const api = new ApiService();
