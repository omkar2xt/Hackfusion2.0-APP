import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  Keyboard,
  AlertTriangle,
  RotateCcw,
  Search,
  CheckCircle2,
  SwitchCamera,
  Zap,
  Upload,
} from 'lucide-react';
import Header from '../components/Header';
import ScanResultCard from '../components/ScanResultCard';
import { useScan } from '../hooks/useScan';
import { api } from '../services/api';
import type { ScanResult, QrAnalysisResult } from '../types';

export default function QrScannerPage() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<'camera' | 'manual'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [decodedContent, setDecodedContent] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [qrGuardianResult, setQrGuardianResult] = useState<QrAnalysisResult | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState(false);

  const qrInstanceRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { result, loading, error: apiError, scanQr, reset } = useScan();

  const playScanChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted before gesture
    }
  };

  const stopCamera = async () => {
    if (qrInstanceRef.current) {
      try {
        if (qrInstanceRef.current.isScanning) {
          await qrInstanceRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping QR scanner:', err);
      }
      try {
        qrInstanceRef.current.clear();
      } catch {
        // Ignore clear errors
      }
      qrInstanceRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCameraWithMode = async (mode: 'environment' | 'user') => {
    setCameraError(null);
    setDecodedContent(null);
    setScanSuccessFeedback(false);
    reset();

    try {
      if (qrInstanceRef.current) {
        await stopCamera();
      }

      const instance = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      qrInstanceRef.current = instance;

      await instance.start(
        { facingMode: mode },
        {
          fps: 20, // High-frequency 20 FPS for instant precision decoding
          // Do NOT pass qrbox so Html5Qrcode scans 100% of the camera stream without crop cutting
        },
        async (decodedText) => {
          playScanChime();
          if (navigator.vibrate) {
            navigator.vibrate([70, 35, 70]);
          }
          setScanSuccessFeedback(true);
          setDecodedContent(decodedText);
          await stopCamera();
          api.analyzeQrGuardian({ raw_qr_content: decodedText }).then(setQrGuardianResult).catch(() => {});
          await scanQr(decodedText);
        },
        (_parseError) => {}
      );

      setIsScanning(true);

      // Probe torch capability
      setTimeout(() => {
        try {
          const video = document.querySelector('#qr-reader-container video') as HTMLVideoElement | null;
          if (video && video.srcObject) {
            const track = (video.srcObject as MediaStream).getVideoTracks()[0];
            if (track && track.getCapabilities) {
              const caps = (track.getCapabilities() as any) || {};
              setHasTorch(Boolean(caps.torch));
            }
          }
        } catch {
          setHasTorch(false);
        }
      }, 500);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError(
        err?.message ||
          'Camera access was denied or not supported on this device. You can upload a QR image or enter the destination manually.'
      );
      setIsScanning(false);
    }
  };

  const handleStartCamera = () => {
    startCameraWithMode(facingMode);
  };

  const handleFlipCamera = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isScanning) {
      await stopCamera();
      setTimeout(() => {
        startCameraWithMode(nextMode);
      }, 250);
    }
  };

  const toggleTorch = async () => {
    try {
      const video = document.querySelector('#qr-reader-container video') as HTMLVideoElement | null;
      if (video && video.srcObject) {
        const track = (video.srcObject as MediaStream).getVideoTracks()[0];
        if (track) {
          const nextState = !torchOn;
          await (track as any).applyConstraints({
            advanced: [{ torch: nextState }],
          });
          setTorchOn(nextState);
        }
      }
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    setDecodedContent(null);
    setScanSuccessFeedback(false);
    reset();

    try {
      if (isScanning) {
        await stopCamera();
      }

      const instance = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });

      const decodedText = await instance.scanFile(file, false);
      playScanChime();
      if (navigator.vibrate) navigator.vibrate([70, 35, 70]);
      setDecodedContent(decodedText);
      api.analyzeQrGuardian({ raw_qr_content: decodedText }).then(setQrGuardianResult).catch(() => {});
      await scanQr(decodedText);
    } catch (err: any) {
      alert(err?.message || 'Could not detect or decode a valid QR code in this image.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualInput.trim();
    if (!trimmed) return;

    setDecodedContent(trimmed);
    api.analyzeQrGuardian({ raw_qr_content: trimmed }).then(setQrGuardianResult).catch(() => {});
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
    setQrGuardianResult(null);
    setManualInput('');
    setCameraError(null);
    setScanSuccessFeedback(false);
    reset();
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-24">
      <Header
        title="QR Code Guard"
        subtitle="Analyze poster & sticker QR codes with precision"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Hidden File Input for Image Scanning */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Mode Selector */}
        <div className="grid grid-cols-2 p-1 bg-white rounded-2xl border border-[#E5E9ED] shadow-sm">
          <button
            onClick={async () => {
              if (activeMode !== 'camera') {
                setActiveMode('camera');
              }
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'camera'
                ? 'bg-[#F0F4F4] text-[#315E63] border border-[#315E63]/25 font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#202A35]'
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
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'manual'
                ? 'bg-[#F0F4F4] text-[#315E63] border border-[#315E63]/25 font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#202A35]'
            }`}
          >
            <Keyboard size={16} />
            Manual Fallback
          </button>
        </div>

        {/* Camera Scanner View */}
        {activeMode === 'camera' && (
          <div className="bg-white rounded-2xl border border-[#E5E9ED] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#202A35]">Device Camera QR Inspection</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Full-frame 20 FPS scanner with real-time payload detection
                </p>
              </div>
              {isScanning && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#27845A]/10 text-[#27845A] text-[11px] font-bold border border-[#27845A]/20">
                  <span className="w-2 h-2 rounded-full bg-[#27845A] animate-ping" />
                  Live Scanner Active
                </span>
              )}
            </div>

            {/* Video Viewport Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-[#E5E9ED] aspect-[4/3] sm:aspect-square flex flex-col items-center justify-center shadow-inner">
              <div id="qr-reader-container" className="w-full h-full" />

              {/* Standby State */}
              {!isScanning && !decodedContent && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/95 backdrop-blur-xs z-10 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#315E63]/10 border border-[#315E63]/20 flex items-center justify-center text-[#315E63] shadow-sm">
                    <QrCode size={32} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#202A35]">Camera on Standby</h3>
                    <p className="text-xs text-[#64748B] max-w-xs mt-1 leading-relaxed">
                      YODHRA requests camera access only after your tap. Live frames are inspected locally in the secure sandbox.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 w-full max-w-xs">
                    <button
                      onClick={handleStartCamera}
                      className="w-full py-2.5 bg-[#315E63] hover:bg-[#397C78] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition active:scale-95"
                    >
                      <Camera size={15} />
                      Start Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#315E63] font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-[#E5E9ED] cursor-pointer transition active:scale-95"
                    >
                      <Upload size={15} />
                      Upload QR Image
                    </button>
                  </div>
                </div>
              )}

              {/* Live Targeting Reticle Overlay (Covers ~88% of entire camera area) */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 z-10">
                  <div
                    className={`relative w-[88%] h-[88%] max-w-[440px] max-h-[440px] rounded-2xl transition-all duration-300 ${
                      scanSuccessFeedback
                        ? 'border-2 border-[#27845A] bg-[#27845A]/10 shadow-[0_0_20px_rgba(39,132,90,0.5)]'
                        : 'border border-[#315E63]/30'
                    }`}
                  >
                    {/* 4 Large Corner Brackets */}
                    <div className="absolute -top-1 -left-1 w-9 h-9 border-t-4 border-l-4 border-[#315E63] rounded-tl-xl shadow-md" />
                    <div className="absolute -top-1 -right-1 w-9 h-9 border-t-4 border-r-4 border-[#315E63] rounded-tr-xl shadow-md" />
                    <div className="absolute -bottom-1 -left-1 w-9 h-9 border-b-4 border-l-4 border-[#315E63] rounded-bl-xl shadow-md" />
                    <div className="absolute -bottom-1 -right-1 w-9 h-9 border-b-4 border-r-4 border-[#315E63] rounded-br-xl shadow-md" />

                    {/* Center Targeting Crosshair */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-40">
                      <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#315E63]" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-[#315E63]" />
                    </div>

                    {/* Animated Scanning Laser Line */}
                    <div className="absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-[#315E63] to-transparent shadow-[0_0_10px_#315E63] animate-laser" />

                    {/* Real-Time Helper Pill */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/65 backdrop-blur-sm text-[10px] font-bold text-white tracking-wider uppercase border border-white/20 whitespace-nowrap shadow-sm">
                      {scanSuccessFeedback ? 'Target Locked & Decoded' : 'Align QR Code in Viewfinder'}
                    </div>
                  </div>
                </div>
              )}

              {/* In-Camera Quick Controls (Flip Camera, Torch, Stop) */}
              {isScanning && (
                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  {hasTorch && (
                    <button
                      onClick={toggleTorch}
                      type="button"
                      className={`p-2.5 rounded-xl backdrop-blur-md transition shadow-sm cursor-pointer ${
                        torchOn ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      title={torchOn ? 'Turn Flash Off' : 'Turn Flash On'}
                    >
                      <Zap size={16} />
                    </button>
                  )}
                  <button
                    onClick={handleFlipCamera}
                    type="button"
                    className="p-2.5 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition shadow-sm cursor-pointer"
                    title={`Switch to ${facingMode === 'environment' ? 'Front' : 'Rear'} Camera`}
                  >
                    <SwitchCamera size={16} />
                  </button>
                </div>
              )}
            </div>

            {isScanning && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-[#64748B]">
                  Using {facingMode === 'environment' ? 'rear environment' : 'front selfie'} camera
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-[#F0F4F4] hover:bg-[#E5E9ED] text-[#315E63] text-xs font-semibold rounded-xl border border-[#E5E9ED] cursor-pointer shadow-xs transition flex items-center gap-1.5"
                  >
                    <Upload size={13} />
                    <span>Upload Image</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-1.5 bg-white hover:bg-[#F0F4F4] text-[#C74747] text-xs font-semibold rounded-xl border border-[#E5E9ED] cursor-pointer shadow-xs transition"
                  >
                    Stop Scanner
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Fallback View */}
        {activeMode === 'manual' && (
          <div className="bg-white rounded-2xl border border-[#E5E9ED] p-5 space-y-4 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-[#202A35]">Manual Content Input</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Paste the decoded text or QR payload if your camera is unavailable.
              </p>
            </div>

            <form onSubmit={handleManualScan} className="space-y-3">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter or paste QR destination (e.g. https://campus-notice.edu/login)..."
                className="w-full bg-[#F7F8FA] border border-[#E5E9ED] focus:border-[#315E63] focus:bg-white rounded-xl py-3 px-3.5 text-xs text-[#202A35] placeholder-[#94A3B8] focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={loading || !manualInput.trim()}
                className="w-full py-3 bg-[#315E63] hover:bg-[#397C78] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition cursor-pointer"
              >
                <Search size={16} />
                {loading ? 'Inspecting QR Target...' : 'Inspect QR Content'}
              </button>
            </form>
          </div>
        )}

        {/* Camera Permission / Device Error */}
        {cameraError && (
          <div className="p-4 rounded-xl bg-[#C58A35]/10 border border-[#C58A35]/25 text-xs text-[#C58A35] flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-[#C58A35] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#202A35]">Camera Notice</p>
              <p className="mt-0.5 text-[#64748B]">{cameraError}</p>
            </div>
          </div>
        )}

        {/* Decoded Content Banner */}
        {decodedContent && (
          <div className="p-5 rounded-2xl bg-white border border-[#E5E9ED] space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#315E63] flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#27845A]" />
                Decoded Destination
              </span>
              <button
                onClick={handleReset}
                className="text-[11px] text-[#315E63] hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <RotateCcw size={12} />
                Scan Another
              </button>
            </div>

            <p className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E5E9ED] text-xs text-[#202A35] font-mono break-all select-all font-medium">
              {decodedContent}
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-[#C58A35] pt-0.5 font-medium">
              <AlertTriangle size={13} />
              <span>For campus safety, YODHRA never auto-opens decoded QR links without sandbox verification.</span>
            </div>

            {/* QR Guardian Registry Match */}
            {qrGuardianResult && (
              <div
                className={`mt-3 p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  qrGuardianResult.is_verified
                    ? 'bg-[#27845A]/10 border-[#27845A]/25 text-[#27845A]'
                    : 'bg-[#C58A35]/10 border-[#C58A35]/25 text-[#C58A35]'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {qrGuardianResult.is_verified ? (
                      <CheckCircle2 size={15} className="text-[#27845A]" />
                    ) : (
                      <AlertTriangle size={15} className="text-[#C58A35]" />
                    )}
                    {qrGuardianResult.is_verified
                      ? 'Verified Official Campus Destination'
                      : 'Unverified External QR Code'}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-white">
                    {qrGuardianResult.badge}
                  </span>
                </div>
                {qrGuardianResult.matched_title && (
                  <p className="text-[11px] text-[#202A35]">
                    Official Target: <strong>{qrGuardianResult.matched_title}</strong> ({qrGuardianResult.matched_department})
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* API Error State */}
        {apiError && (
          <div className="p-4 rounded-xl bg-[#C74747]/10 border border-[#C74747]/25 text-xs text-[#C74747] flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-[#C74747] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#202A35]">Analysis Failed</p>
              <p className="mt-0.5 text-[#C74747]/90">{apiError}</p>
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
