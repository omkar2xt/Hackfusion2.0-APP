import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { demoSignIn } = useAuthContext();

  const handleInstantDemo = async () => {
    await demoSignIn('student');
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0f1e] via-[#0d1326] to-[#111827]">
      {/* Animated grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #14b8a6 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Animated floating dots */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-teal-500/30 animate-pulse" />
        <div
          className="absolute top-1/3 right-1/4 h-1.5 w-1.5 rounded-full bg-cyan-400/25 animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
        <div
          className="absolute bottom-1/3 left-1/3 h-1 w-1 rounded-full bg-teal-400/20 animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-2/3 right-1/3 h-2.5 w-2.5 rounded-full bg-cyan-500/15 animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
        <div
          className="absolute bottom-1/4 right-1/5 h-1.5 w-1.5 rounded-full bg-teal-300/20 animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Radial glow behind shield */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl animate-pulse" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Shield icon with glow */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-teal-500/20 blur-xl animate-pulse" />
          </div>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/30">
            <Shield className="h-10 w-10 text-white" strokeWidth={2} />
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          SignalSafe Campus
        </h1>

        {/* Tagline */}
        <p className="mb-12 text-lg text-slate-400">
          Think Before You Click.
        </p>

        {/* Sign In button */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full max-w-sm rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-teal-500/40 hover:brightness-110 active:scale-[0.98]"
        >
          Sign In to Campus Account
        </button>

        {/* Instant Demo Access */}
        <button
          type="button"
          onClick={handleInstantDemo}
          className="mt-3 w-full max-w-sm rounded-xl border border-teal-500/40 bg-teal-500/10 px-6 py-3 text-sm font-semibold text-teal-300 shadow-md transition-all duration-200 hover:bg-teal-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4 text-teal-400" />
          <span>Launch Campus Dashboard (Instant Access)</span>
          <ArrowRight className="h-4 w-4 text-teal-400" />
        </button>

        {/* Get Started link */}
        <button
          type="button"
          onClick={() => navigate('/signup')}
          className="mt-4 text-sm font-medium text-slate-400 transition-colors hover:text-teal-300"
        >
          Don't have an account? <span className="text-teal-400 font-semibold">Sign Up →</span>
        </button>
      </div>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0f1e] to-transparent" />
    </div>
  );
}
