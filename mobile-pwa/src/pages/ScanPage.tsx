import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Globe,
  MessageSquare,
  Search,
  AlertTriangle,
  RotateCcw,
  Info,
} from 'lucide-react';
import Header from '../components/Header';
import ScanResultCard from '../components/ScanResultCard';
import { useScan } from '../hooks/useScan';
import { validateUrl } from '../utils/helpers';
import type { ScanResult } from '../types';

export default function ScanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') === 'message' ? 'message' : 'url';

  // URL Tab state
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Message Tab state
  const [messageInput, setMessageInput] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);

  const { result, loading, error, scanUrl, scanMessage, reset } = useScan();

  const handleTabSwitch = (tab: 'url' | 'message') => {
    setSearchParams(tab === 'message' ? { tab: 'message' } : {});
    reset();
    setUrlError(null);
    setMessageError(null);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError('Please enter a valid URL to analyze.');
      return;
    }

    // Basic format check
    const formattedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (!validateUrl(formattedUrl)) {
      setUrlError('Please enter a valid web address (e.g., https://example.edu)');
      return;
    }

    setUrlError(null);
    await scanUrl(formattedUrl);
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed) {
      setMessageError('Please paste or enter the message text you wish to analyze.');
      return;
    }
    if (trimmed.length < 5) {
      setMessageError('Message content must be at least 5 characters long.');
      return;
    }

    setMessageError(null);
    await scanMessage(trimmed);
  };

  const handleReport = (scanResult: ScanResult) => {
    navigate('/report', {
      state: {
        category: 'phishing',
        suspiciousContent: scanResult.input_value,
        description: `Flagged by SignalSafe Campus scan: ${scanResult.verdict} with risk score ${scanResult.risk_score}/100.`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#202A35] pb-24">
      <Header
        title="Threat Analysis"
        subtitle="Detect malicious URLs & phishing messages"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-white rounded-2xl border border-[#E5E9ED] shadow-xs">
          <button
            onClick={() => handleTabSwitch('url')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-[#F0F4F4] text-[#315E63] border border-[#315E63]/25 font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#202A35]'
            }`}
          >
            <Globe size={16} />
            URL Scanner
          </button>
          <button
            onClick={() => handleTabSwitch('message')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'message'
                ? 'bg-[#F0F4F4] text-[#315E63] border border-[#315E63]/25 font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#202A35]'
            }`}
          >
            <MessageSquare size={16} />
            Message Analyzer
          </button>
        </div>

        {/* Tab 1: URL Scanner */}
        {activeTab === 'url' && (
          <div className="bg-white rounded-2xl border border-[#E5E9ED] p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-[#202A35] flex items-center gap-2">
                <Globe size={16} className="text-[#315E63]" />
                Submit URL for Inspection
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Enter any campus link, shortened URL, or suspicious portal destination.
              </p>
            </div>

            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  placeholder="https://campus-login.verify-auth.xyz/portal"
                  className={`w-full bg-[#F7F8FA] border rounded-xl py-3 pl-3.5 pr-10 text-sm text-[#202A35] placeholder-[#64748B] focus:outline-none transition-all ${
                    urlError
                      ? 'border-[#C74747]'
                      : 'border-[#E5E9ED] focus:border-[#315E63] focus:bg-white'
                  }`}
                />
                {urlInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput('');
                      reset();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#202A35] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {urlError && (
                <div className="flex items-center gap-1.5 text-xs text-[#C74747]">
                  <AlertTriangle size={13} />
                  <span>{urlError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#315E63] hover:bg-[#274B4F] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Search size={16} />
                  {loading ? 'Inspecting Link...' : 'Scan URL'}
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setUrlInput('');
                    }}
                    className="p-3 bg-white border border-[#E5E9ED] hover:bg-[#F0F4F4] text-[#64748B] hover:text-[#202A35] rounded-xl cursor-pointer"
                    title="Reset scan"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Message Analyzer */}
        {activeTab === 'message' && (
          <div className="bg-white rounded-2xl border border-[#E5E9ED] p-5 space-y-4 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-[#202A35] flex items-center gap-2">
                <MessageSquare size={16} className="text-[#315E63]" />
                Analyze Suspicious Text or Email
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Paste suspicious SMS, student portal alert, or unexpected password reset request.
              </p>
            </div>

            <form onSubmit={handleMessageSubmit} className="space-y-3">
              <div>
                <textarea
                  rows={4}
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    if (messageError) setMessageError(null);
                  }}
                  placeholder="Paste message content here: e.g., 'URGENT: Your university student account will be disabled in 2 hours unless you update your password at bit.ly/...'"
                  className={`w-full bg-[#F7F8FA] border rounded-xl p-3 text-sm text-[#202A35] placeholder-[#64748B] focus:outline-none transition-all ${
                    messageError
                      ? 'border-[#C74747]'
                      : 'border-[#E5E9ED] focus:border-[#315E63] focus:bg-white'
                  }`}
                />
                <div className="flex justify-between items-center text-[11px] text-[#64748B] mt-1 px-1">
                  <span>Never submits your private login credentials</span>
                  <span>{messageInput.length} chars</span>
                </div>
              </div>

              {messageError && (
                <div className="flex items-center gap-1.5 text-xs text-[#C74747]">
                  <AlertTriangle size={13} />
                  <span>{messageError}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#315E63] hover:bg-[#274B4F] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Search size={16} />
                  {loading ? 'Analyzing Content...' : 'Analyze Message'}
                </button>
                {result && (
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setMessageInput('');
                    }}
                    className="p-3 bg-white border border-[#E5E9ED] hover:bg-[#F0F4F4] text-[#64748B] hover:text-[#202A35] rounded-xl cursor-pointer"
                    title="Reset scan"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Error notification if API failed */}
        {error && (
          <div className="p-4 rounded-xl bg-[#C74747]/10 border border-[#C74747]/25 text-xs text-[#C74747] flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-[#C74747] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analysis Failed</p>
              <p className="mt-0.5 text-[#C74747]/90">{error}</p>
            </div>
          </div>
        )}

        {/* Security Warning Notice */}
        <div className="p-3.5 rounded-xl bg-white border border-[#E5E9ED] flex items-start gap-2.5 text-[11px] text-[#64748B] shadow-xs">
          <Info size={15} className="text-[#315E63] flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-[#202A35]">Campus Safety Rule:</strong> A result of{' '}
            <span className="text-[#27845A] font-bold">LOW_RISK</span> does not guarantee absolute safety. Always verify sender identity directly through campus official channels.
          </p>
        </div>

        {/* Scan Results Display */}
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
