import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  Keyboard,
  AlertTriangle,
  RotateCcw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import Header from '../components/Header';
import ScanResultCard from '../components/ScanResultCard';
import { useScan } from '../hooks/useScan';
import type { ScanResult } from '../types';

export default function QrScannerPage() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<'camera' | 'manual'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [decodedContent, setDecodedContent] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');

  const qrInstanceRef = useRef<Html5Qrcode | null>(null);
  const { result, loading, error: apiError, scanQr, reset } = useScan();

  const stopCamera = async () => {
    if (qrInstanceRef.current) {
      try {
        if (qrInstanceRef.current.isScanning) {
          await qrInstanceRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping QR scanner:', err);
      }
      qrInstanceRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      // Component unmount cleanup
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setDecodedContent(null);
    reset();

    try {
      // Create reader instance if not exists
      if (!qrInstanceRef.current) {
        qrInstanceRef.current = new Html5Qrcode('qr-reader-container');
      }

      await qrInstanceRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        async (decodedText) => {
          // Found QR Code!
          setDecodedContent(decodedText);
          await stopCamera();
          // Automatically trigger security inspection on the decoded content
          await scanQr(decodedText);
        },
        (_parseError) => {
          // Normal frame scan tick without QR code, ignore
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError(
        err?.message ||
          'Camera access was denied or not supported on this device. You can enter the QR destination manually below.'
      );
      setIsScanning(false);
      // Fallback to manual
      setActiveMode('manual');
    }
  };

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualInput.trim();
    if (!trimmed) return;

    setDecodedContent(trimmed);
    await scanQr(trimmed);
  };

  const handleReport = (scanResult: ScanResult) => {
    navigate('/report', {
      state: {
        category: 'malware',
        suspiciousContent: scanResult.input_value,
        description: `QR Code flagged as ${scanResult.verdict} with risk score ${scanResult.risk_score}/100. Destination: ${scanResult.input_value}`,
      },
    });
  };

  const handleReset = async () => {
    await stopCamera();
    setDecodedContent(null);
    setManualInput('');
    setCameraError(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-24">
      <Header
        title="QR Code Guard"
        subtitle="Analyze poster & sticker QR codes safely"
      />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            onClick={async () => {
              if (activeMode !== 'camera') {
                setActiveMode('camera');
              }
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === 'camera'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera size={16} />
            Camera Scanner
          </button>
          <button
            onClick={async () => {
              if (activeMode !== 'manual') {
                await stopCamera();
                setActiveMode('manual');
              }
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === 'manual'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard size={16} />
            Manual Fallback
          </button>
        </div>

        {/* Camera Scanner View */}
        {activeMode === 'camera' && (
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Device Camera QR Inspection</h2>
                <p className="text-xs text-slate-400">
                  Aim at flyers, cafeteria notices, or campus doors
                </p>
              </div>
              {isScanning && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 text-[11px] font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  Live Scanner
                </span>
              )}
            </div>

            {/* Video Viewport Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square flex flex-col items-center justify-center">
              <div id="qr-reader-container" className="w-full h-full" />

              {!isScanning && !decodedContent && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 backdrop-blur-sm z-10">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3">
                    <QrCode size={32} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Camera on Standby</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">
                    SignalSafe requests camera access only after your tap. We never stream or save video recordings.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20"
                  >
                    <Camera size={15} />
                    Start Camera
                  </button>
                </div>
              )}
            </div>

            {isScanning && (
              <div className="flex justify-center">
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700"
                >
                  Stop Scanner
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Fallback View */}
        {activeMode === 'manual' && (
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Manual Content Input</h2>
              <p className="text-xs text-slate-400">
                Paste the decoded text or QR payload if your camera is unavailable.
              </p>
            </div>

            <form onSubmit={handleManualScan} className="space-y-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter or paste QR destination..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-teal-400 rounded-xl py-3 px-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !manualInput.trim()}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all"
              >
                <Search size={16} />
                {loading ? 'Inspecting QR Target...' : 'Inspect QR Content'}
              </button>
            </form>
          </div>
        )}

        {/* Camera Permission / Device Error */}
        {cameraError && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Camera Access Notice</p>
              <p className="mt-0.5 text-amber-200/90">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Decoded Content Banner (Strictly never auto-browses) */}
        {decodedContent && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-teal-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Decoded Destination
              </span>
              <button
                onClick={handleReset}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw size={12} />
                Scan Another
              </button>
            </div>

            <p className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono break-all select-all">
              {decodedContent}
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 pt-1">
              <AlertTriangle size={12} />
              <span>For campus safety, SignalSafe never auto-opens decoded QR links.</span>
            </div>
          </div>
        )}

        {/* API Error State */}
        {apiError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analysis Failed</p>
              <p className="mt-0.5 text-red-300/90">{apiError}</p>
            </div>
          </div>
        )}

        {/* Scan Result */}
        <div className="mt-4">
          <ScanResultCard
            result={result}
            loading={loading}
            onReport={handleReport}
          />
        </div>
      </div>
    </div>
  );
}