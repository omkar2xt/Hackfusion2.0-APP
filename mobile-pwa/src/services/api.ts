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

    const response = await fetch(url, {
      ...options,
      headers,
    });

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
}

export const api = new ApiService();
