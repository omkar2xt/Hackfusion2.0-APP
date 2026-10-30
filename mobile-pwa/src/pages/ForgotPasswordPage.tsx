import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { validateEmail } from '../utils/helpers';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuthContext();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailValid = validateEmail(email);
  const canSubmit = emailValid && !loading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset link. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-6 py-12 text-[#202A35]">
      {/* Back button */}
      <div className="fixed left-4 top-4 z-20">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#202A35] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </button>
      </div>

      {/* Branding */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#315E63] shadow-sm">
          <Shield className="h-7 w-7 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-[#202A35]">Reset Password</h1>
        <p className="mt-1 text-center text-xs text-[#64748B]">
          Enter your institutional email to receive a secure recovery link.
        </p>
      </div>

      {sent ? (
        /* Success state */
        <div className="w-full max-w-sm text-center bg-white rounded-2xl border border-[#E5E9ED] p-6 sm:p-8 shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#27845A]/10">
              <CheckCircle2 className="h-8 w-8 text-[#27845A]" />
            </div>
          </div>
          <h2 className="mb-2 text-base font-bold text-[#202A35]">Check Your Email</h2>
          <p className="mb-6 text-xs text-[#64748B] leading-relaxed">
            We&apos;ve sent a password reset link to{' '}
            <span className="font-semibold text-[#315E63]">{email}</span>. Please check your inbox and spam folder.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-xl bg-[#315E63] hover:bg-[#397C78] px-6 py-3 text-xs font-bold text-white shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Back to Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail('');
              setTouched(false);
            }}
            className="mt-3 text-xs font-semibold text-[#315E63] hover:underline transition-colors cursor-pointer"
          >
            Try a different email
          </button>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E9ED] p-6 sm:p-8 space-y-5 shadow-sm">
          {error && (
            <div className="rounded-xl border border-[#C74747]/30 bg-[#C74747]/10 px-4 py-3 text-xs text-[#C74747] font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#202A35]">
              Institutional Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#64748B]" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="you@university.edu"
                className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-xs text-[#202A35] placeholder-[#94A3B8] outline-none transition-colors focus:ring-2 ${
                  touched && !emailValid && email.length > 0
                    ? 'border-[#C74747] focus:ring-[#C74747]/20'
                    : 'border-[#E5E9ED] focus:border-[#315E63] focus:ring-[#315E63]/20'
                }`}
              />
            </div>
            {touched && !emailValid && email.length > 0 && (
              <p className="mt-1 text-xs text-[#C74747]">Please enter a valid email address.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#315E63] hover:bg-[#397C78] px-6 py-3.5 text-xs font-bold text-white shadow-sm transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </div>
  );
}
