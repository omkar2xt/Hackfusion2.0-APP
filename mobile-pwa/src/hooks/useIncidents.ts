import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import type { Incident, CreateIncidentRequest } from '../types';

interface UseIncidentsReturn {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  createIncident: (data: CreateIncidentRequest) => Promise<Incident>;
  refreshIncidents: () => Promise<void>;
  getIncident: (id: string) => Promise<Incident>;
}

export function useIncidents(): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshIncidents = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch incidents';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshIncidents();
  }, [refreshIncidents]);

  const createIncident = useCallback(
    async (data: CreateIncidentRequest): Promise<Incident> => {
      setLoading(true);
      setError(null);
      try {
        const incident = await api.createIncident(data);
        setIncidents((prev) => [incident, ...prev]);
        return incident;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create incident';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getIncident = useCallback(async (id: string): Promise<Incident> => {
    try {
      const incident = await api.getIncident(id);
      return incident;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch incident';
      setError(message);
      throw err;
    }
  }, []);

  return {
    incidents,
    loading,
    error,
    createIncident,
    refreshIncidents,
    getIncident,
  };
}
