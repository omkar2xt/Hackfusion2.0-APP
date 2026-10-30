import { useState, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, User, Loader2, Check, X } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { validateEmail } from '../utils/helpers';

interface PasswordStrength {
  hasMinLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
}

function getPasswordStrength(password: string): PasswordStrength {
  return {
    hasMinLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
  };
}

function StrengthIndicator({ strength }: { strength: PasswordStrength }) {
  const checks = [
    { label: 'At least 8 characters', met: strength.hasMinLength },
    { label: 'Contains a number', met: strength.hasNumber },
    { label: 'Contains uppercase letter', met: strength.hasUppercase },
  ];

  return (
    <div className="mt-2 space-y-1">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-1.5">
          {check.met ? (
            <Check className="h-3.5 w-3.5 text-teal-400" />
          ) : (
            <X className="h-3.5 w-3.5 text-slate-500" />
          )}
          <span
            className={`text-xs ${check.met ? 'text-teal-400' : 'text-slate-500'}`}
          >
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, demoSignIn } = useAuthContext();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const emailValid = validateEmail(email);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordStrong =
    passwordStrength.hasMinLength &&
    passwordStrength.hasNumber &&
    passwordStrength.hasUppercase;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const fullNameValid = fullName.trim().length > 0;

  const canSubmit = fullNameValid && emailValid && passwordStrong && passwordsMatch && !loading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, fullName.trim());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Account creation failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0a0f1e] via-[#0d1326] to-[#111827] px-6 py-12">
      {/* Branding */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
          <Shield className="h-7 w-7 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="mt-1 text-sm text-slate-400">Join SignalSafe Campus</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-300">
            Full Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
              placeholder="Your full name"
              className={`w-full rounded-lg border bg-slate-800 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:ring-2 ${
                touched.fullName && !fullNameValid
                  ? 'border-red-500 focus:ring-red-500/40'
                  : 'border-slate-700 focus:border-teal-500 focus:ring-teal-500/40'
              }`}
            />
          </div>
          {touched.fullName && !fullNameValid && (
            <p className="mt-1 text-xs text-red-400">Full name is required.</p>
          )}
        </div>

        {/* Email */}
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
                touched.email && !emailValid && email.length > 0
                  ? 'border-red-500 focus:ring-red-500/40'
                  : 'border-slate-700 focus:border-teal-500 focus:ring-teal-500/40'
              }`}
            />
          </div>
          {touched.email && !emailValid && email.length > 0 && (
            <p className="mt-1 text-xs text-red-400">Please enter a valid email address.</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="Create a strong password"
              className={`w-full rounded-lg border bg-slate-800 py-3 pl-10 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:ring-2 ${
                touched.password && !passwordStrong
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
          {password.length > 0 && <StrengthIndicator strength={passwordStrength} />}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-300">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              placeholder="Confirm your password"
              className={`w-full rounded-lg border bg-slate-800 py-3 pl-10 pr-12 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:ring-2 ${
                touched.confirmPassword && !passwordsMatch
                  ? 'border-red-500 focus:ring-red-500/40'
                  : 'border-slate-700 focus:border-teal-500 focus:ring-teal-500/40'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          {touched.confirmPassword && confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-400">Passwords do not match.</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-teal-500/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-teal-500/25 disabled:hover:brightness-100"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* Quick Demo Access Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="w-full border-t border-slate-700/60" />
          <span className="absolute bg-[#0d1326] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            or instant access
          </span>
        </div>

        <button
          type="button"
          onClick={async () => {
            await demoSignIn('student');
            navigate('/dashboard', { replace: true });
          }}
          className="w-full flex items-center justify-center py-2.5 px-3 rounded-xl bg-slate-800/80 border border-teal-500/30 hover:border-teal-500/60 text-teal-300 font-semibold text-xs transition"
        >
          Instant Campus Student Demo Access
        </button>

        {/* Sign in link */}
        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-medium text-teal-400 hover:text-teal-300 transition-colors"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}
