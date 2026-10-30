import { useState, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Loader2, Check, X } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { validateEmail } from '../utils/helpers';
import Logo from '../components/Logo';

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
            <Check className="h-3.5 w-3.5 text-[#27845A]" />
          ) : (
            <X className="h-3.5 w-3.5 text-[#64748B]" />
          )}
          <span
            className={`text-xs ${check.met ? 'text-[#27845A] font-semibold' : 'text-[#64748B]'}`}
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-6 py-12 text-[#202A35]">
      {/* Branding */}
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size="lg" showText={false} className="mb-2.5" />
        <h1 className="text-2xl font-black text-[#202A35] tracking-wider uppercase">YODHRA</h1>
        <p className="mt-0.5 text-xs text-[#315E63] font-bold uppercase tracking-wider">
          Create Incident Responder Account
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E9ED] p-6 sm:p-8 space-y-4 shadow-sm">
        {/* Error */}
        {error && (
          <div className="rounded-xl border border-[#C74747]/30 bg-[#C74747]/10 px-4 py-3 text-xs text-[#C74747] font-medium">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-xs font-semibold text-[#202A35]">
            Full Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#64748B]" />
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
              placeholder="Your full name"
              className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-xs text-[#202A35] placeholder-[#94A3B8] outline-none transition-colors focus:ring-2 ${
                touched.fullName && !fullNameValid
                  ? 'border-[#C74747] focus:ring-[#C74747]/20'
                  : 'border-[#E5E9ED] focus:border-[#315E63] focus:ring-[#315E63]/20'
              }`}
            />
          </div>
          {touched.fullName && !fullNameValid && (
            <p className="mt-1 text-xs text-[#C74747]">Full name is required.</p>
          )}
        </div>

        {/* Email */}
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
                touched.email && !emailValid && email.length > 0
                  ? 'border-[#C74747] focus:ring-[#C74747]/20'
                  : 'border-[#E5E9ED] focus:border-[#315E63] focus:ring-[#315E63]/20'
              }`}
            />
          </div>
          {touched.email && !emailValid && email.length > 0 && (
            <p className="mt-1 text-xs text-[#C74747]">Please enter a valid email address.</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#202A35]">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#64748B]" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="Create a strong password"
              className={`w-full rounded-xl border bg-white py-3 pl-10 pr-12 text-xs text-[#202A35] placeholder-[#94A3B8] outline-none transition-colors focus:ring-2 ${
                touched.password && !passwordStrong
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
          {password.length > 0 && <StrengthIndicator strength={passwordStrength} />}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-[#202A35]">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#64748B]" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              placeholder="Confirm your password"
              className={`w-full rounded-xl border bg-white py-3 pl-10 pr-12 text-xs text-[#202A35] placeholder-[#94A3B8] outline-none transition-colors focus:ring-2 ${
                touched.confirmPassword && !passwordsMatch
                  ? 'border-[#C74747] focus:ring-[#C74747]/20'
                  : 'border-[#E5E9ED] focus:border-[#315E63] focus:ring-[#315E63]/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#202A35] transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          {touched.confirmPassword && confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1 text-xs text-[#C74747]">Passwords do not match.</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#315E63] hover:bg-[#397C78] px-6 py-3.5 text-xs font-bold text-white shadow-sm transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* Quick Demo Access Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="w-full border-t border-[#E5E9ED]" />
          <span className="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            or instant access
          </span>
        </div>

        <button
          type="button"
          onClick={async () => {
            await demoSignIn('student');
            navigate('/dashboard', { replace: true });
          }}
          className="w-full flex items-center justify-center py-2.5 px-3 rounded-xl bg-[#F0F4F4] hover:bg-[#E5E9ED] border border-[#E5E9ED] text-[#315E63] font-bold text-xs transition cursor-pointer"
        >
          Instant Campus Student Demo Access
        </button>

        {/* Sign in link */}
        <p className="text-center text-xs text-[#64748B] pt-1">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-bold text-[#315E63] hover:underline cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}
