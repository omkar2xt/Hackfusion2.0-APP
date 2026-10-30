import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { validateEmail } from '../utils/helpers';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, demoSignIn } = useAuthContext();

  const handleDemoSignIn = async (role: 'student' | 'admin' = 'student') => {
    setLoading(true);
    try {
      await demoSignIn(role);
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailValid = validateEmail(email);
  const passwordValid = password.length > 0;

  const canSubmit = emailValid && passwordValid && !loading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0a0f1e] via-[#0d1326] to-[#111827] px-6 py-12">
      {/* Branding */}
      <div className="mb-10 flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
          <Shield className="h-7 w-7 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-white">SignalSafe Campus</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="you@university.edu"
              className={`w-full rounded-lg border bg-slate-800 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:ring-2 ${
                touched.email && !emailValid
                  ? 'border-red-500 focus:ring-red-500/40'
                  : 'border-slate-700 focus:border-teal-500 focus:ring-teal-500/40'
              }`}
            />
          </div>
          {touched.email && !emailValid && email.length > 0 && (
            <p className="mt-1 text-xs text-red-400">Please enter a valid email address.</p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="Enter your password"
              className={`w-full rounded-lg border bg-slate-800 py-3 pl-10 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:ring-2 ${
                touched.password && !passwordValid
                  ? 'border-red-500 focus:ring-red-500/40'
                  : 'border-slate-700 focus:border-teal-500 focus:ring-teal-500/40'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          {touched.password && !passwordValid && (
            <p className="mt-1 text-xs text-red-400">Password is required.</p>
          )}
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-teal-500/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-teal-500/25 disabled:hover:brightness-100"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {/* Quick Demo Access Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="w-full border-t border-slate-700/60" />
          <span className="absolute bg-[#0d1326] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            or instant access
          </span>
        </div>

        {/* 1-Click Demo Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoSignIn('student')}
            className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-slate-800/80 border border-teal-500/30 hover:border-teal-500/60 text-teal-300 font-semibold text-xs transition"
          >
            Demo Student
          </button>
          <button
            type="button"
            onClick={() => handleDemoSignIn('admin')}
            className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-slate-800/80 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 font-semibold text-xs transition"
          >
            Security Admin
          </button>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="font-medium text-teal-400 hover:text-teal-300 transition-colors"
          >
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
}
