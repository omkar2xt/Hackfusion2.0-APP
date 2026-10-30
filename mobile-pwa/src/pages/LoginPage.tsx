import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { validateEmail } from '../utils/helpers';
import Logo from '../components/Logo';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-6 py-12 text-[#202A35]">
      {/* Branding */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size="xl" variant="full" showText={false} className="mb-3" />
        <h1 className="text-3xl font-black text-[#202A35] tracking-wider uppercase">YODHRA</h1>
        <p className="text-xs font-bold text-[#315E63] tracking-widest uppercase mt-0.5">
          CYBER INTELLIGENCE • CAMPUS
        </p>
        <p className="text-[11px] text-[#64748B] font-mono tracking-wider mt-1">
          DEFEND • DETECT • RESPOND
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E9ED] p-6 sm:p-8 space-y-5 shadow-sm">
        {/* Error message */}
        {error && (
          <div className="rounded-xl border border-[#C74747]/30 bg-[#C74747]/10 px-4 py-3 text-xs text-[#C74747] font-medium">
            {error}
          </div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#202A35]">
            Institutional Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#64748B]" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="you@university.edu"
              className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-xs text-[#202A35] placeholder-[#94A3B8] outline-none transition-colors focus:ring-2 ${
                touched.email && !emailValid
                  ? 'border-[#C74747] focus:ring-[#C74747]/20'
                  : 'border-[#E5E9ED] focus:border-[#315E63] focus:ring-[#315E63]/20'
              }`}
            />
          </div>
          {touched.email && !emailValid && email.length > 0 && (
            <p className="mt-1 text-xs text-[#C74747]">Please enter a valid email address.</p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#202A35]">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#64748B]" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="Enter your password"
              className={`w-full rounded-xl border bg-white py-3 pl-10 pr-12 text-xs text-[#202A35] placeholder-[#94A3B8] outline-none transition-colors focus:ring-2 ${
                touched.password && !passwordValid
                  ? 'border-[#C74747] focus:ring-[#C74747]/20'
                  : 'border-[#E5E9ED] focus:border-[#315E63] focus:ring-[#315E63]/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#202A35] transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          {touched.password && !passwordValid && (
            <p className="mt-1 text-xs text-[#C74747]">Password is required.</p>
          )}
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-xs font-semibold text-[#315E63] hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#315E63] hover:bg-[#397C78] px-6 py-3.5 text-xs font-bold text-white shadow-sm transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {/* Quick Demo Access Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="w-full border-t border-[#E5E9ED]" />
          <span className="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            or instant access
          </span>
        </div>

        {/* 1-Click Demo Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoSignIn('student')}
            className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-[#F0F4F4] hover:bg-[#E5E9ED] border border-[#E5E9ED] text-[#315E63] font-bold text-xs transition cursor-pointer"
          >
            Demo Student
          </button>
          <button
            type="button"
            onClick={() => handleDemoSignIn('admin')}
            className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-[#F0F4F4] hover:bg-[#E5E9ED] border border-[#E5E9ED] text-[#315E63] font-bold text-xs transition cursor-pointer"
          >
            Security Admin
          </button>
        </div>

        {/* Sign up link */}
        <p className="text-center text-xs text-[#64748B] pt-1">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="font-bold text-[#315E63] hover:underline cursor-pointer"
          >
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
}
