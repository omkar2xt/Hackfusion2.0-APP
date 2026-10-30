import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { ScanResult } from '../types';

interface UseScanReturn {
  result: ScanResult | null;
  loading: boolean;
  error: string | null;
  scanUrl: (url: string) => Promise<void>;
  scanMessage: (text: string) => Promise<void>;
  scanQr: (content: string) => Promise<void>;
  reset: () => void;
}

export function useScan(): UseScanReturn {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanUrl = useCallback(async (url: string): Promise<void> => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.scanUrl({ url });
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan URL';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const scanMessage = useCallback(async (text: string): Promise<void> => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.scanMessage({ message_text: text });
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan message';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const scanQr = useCallback(async (content: string): Promise<void> => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.scanQr({ decoded_content: content });
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan QR content';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    result,
    loading,
    error,
    scanUrl,
    scanMessage,
    scanQr,
    reset,
  };
}
