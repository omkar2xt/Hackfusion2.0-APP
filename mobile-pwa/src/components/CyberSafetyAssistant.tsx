import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Lightbulb,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CyberSafetyAssistantProps {
  threatType?: string;
  verdict?: string;
  payload?: string;
  score?: number;
}

export const CyberSafetyAssistant: React.FC<CyberSafetyAssistantProps> = ({
  threatType = 'phishing',
  payload,
}) => {
  const [expanded, setExpanded] = useState(true);

  // Derive customized personalized explanation based on threat category
  const lower = (threatType + ' ' + (payload || '')).toLowerCase();

  let title = 'Educational Threat Breakdown';
  let whyDangerous = 'Phishing links trick victims into entering institutional passwords on mirror sites under false pretenses.';
  let howToRecognize = 'Check the root domain ending (.edu). Look for urgency language like "within 2 hours" or "account will be deleted".';
  let immediateRule = 'Never confirm passwords via email or SMS links. Open a new tab and navigate to the official campus portal directly.';
  let badgeCategory = 'Phishing Detection';

  if (lower.includes('qr') || lower.includes('quish')) {
    title = 'Quishing (Malicious QR Code) Analysis';
    badgeCategory = 'QR Guardian Safety';
    whyDangerous = 'Attackers place physical stickers over legitimate campus bulletin board notices. When scanned, camera apps often open the deceptive destination without warning.';
    howToRecognize = 'Feel the physical notice for sticker overlay edges. Inspect the full URL string before approving any browser redirect or sign-in.';
    immediateRule = 'Use SignalSafe QR Guard to verify the destination against the verified institutional campus directory.';
  } else if (lower.includes('bursar') || lower.includes('wire') || lower.includes('refund') || lower.includes('payment') || lower.includes('theft')) {
    title = 'Tuition & Financial Wire Trap Breakdown';
    badgeCategory = 'Financial Scam Prevention';
    whyDangerous = 'Impersonators pose as campus finance officers claiming you have an unpaid fee or urgent bursar refund, requiring external wire or payment cards.';
    howToRecognize = 'Universities will NEVER request payments via Zelle, wire transfer, gift cards, or external payment apps. Legitimate refunds post to your official student account.';
    immediateRule = 'Call the Bursar or Financial Aid Office using the phone number printed on your student ID card.';
  } else if (lower.includes('ransom') || lower.includes('malware') || lower.includes('exe')) {
    title = 'Malware & Ransomware Defense Explanation';
    badgeCategory = 'Malware Prevention';
    whyDangerous = 'Malicious attachments or downloads execute background encryption or keyloggers that harvest campus session cookies and personal files.';
    howToRecognize = 'Unexpected compressed files (.zip, .iso, .exe) or urgent invoice notifications from unknown senders.';
    immediateRule = 'Do not open or extract attachments. Notify campus IT security immediately to quarantine the message.';
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/40 shadow-xl space-y-3">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Sparkles size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{title}</span>
              <span className="text-[10px] uppercase font-bold text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2 py-0.2 rounded-full">
                {badgeCategory}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Personalized Cyber Safety Coach Explanation</p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-white p-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="flex items-start gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-300 block mb-0.5 font-semibold">Why this is dangerous:</strong>
              <p className="text-slate-300 leading-relaxed text-[11px]">{whyDangerous}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 block mb-0.5 font-semibold">How to spot similar scams in the future:</strong>
              <p className="text-slate-300 leading-relaxed text-[11px]">{howToRecognize}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-300 block mb-0.5 font-semibold">Immediate Defensive Action:</strong>
              <p className="text-slate-300 leading-relaxed text-[11px]">{immediateRule}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CyberSafetyAssistant;
