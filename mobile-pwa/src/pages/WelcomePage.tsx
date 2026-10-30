import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { demoSignIn } = useAuthContext();

  const handleInstantDemo = async () => {
    await demoSignIn('student');
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#F7F8FA] px-6 py-12 text-[#202A35]">
      {/* Main card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E9ED] p-8 sm:p-10 text-center shadow-sm flex flex-col items-center space-y-6">
        {/* Emblem icon */}
        <div className="flex items-center justify-center">
          <Logo size="xl" showText={false} />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-[#202A35] uppercase font-sans">
            YODHRA
          </h1>
          <p className="text-xs font-bold tracking-widest text-[#315E63] uppercase">
            CYBER INTELLIGENCE • CAMPUS
          </p>
          <p className="text-xs font-mono tracking-widest text-[#64748B] pt-1">
            DEFEND • DETECT • RESPOND
          </p>
        </div>

        <p className="text-xs text-[#64748B] max-w-sm leading-relaxed">
          Enterprise cyber safety platform safeguarding university students, staff, and campus infrastructure against phishing, malicious QR codes, and institutional network threats.
        </p>

        {/* Actions */}
        <div className="w-full space-y-3 pt-2">
          {/* Sign In button */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-xl bg-[#315E63] hover:bg-[#397C78] px-6 py-3.5 text-xs font-bold text-white shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Sign In to Campus Account
          </button>

          {/* Instant Demo Access */}
          <button
            type="button"
            onClick={handleInstantDemo}
            className="w-full rounded-xl border border-[#E5E9ED] bg-[#F0F4F4] hover:bg-[#E5E9ED] px-6 py-3 text-xs font-bold text-[#315E63] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-[#315E63]" />
            <span>Launch Campus Dashboard (Instant Demo)</span>
            <ArrowRight className="h-4 w-4 text-[#315E63]" />
          </button>
        </div>

        {/* Get Started link */}
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="text-xs font-medium text-[#64748B] transition-colors hover:text-[#202A35] cursor-pointer"
        >
          Don't have an account? <span className="text-[#315E63] font-bold hover:underline">Sign Up →</span>
        </button>
      </div>
    </div>
  );
}
