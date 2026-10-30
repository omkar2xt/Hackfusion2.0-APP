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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0a0f1e] via-[#0d1326] to-[#111827] px-6 py-12">
      {/* Back button */}
      <div className="fixed left-4 top-4 z-20">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </button>
      </div>

      {/* Branding */}
      <div className="mb-10 flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
          <Shield className="h-7 w-7 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-white">Reset Password</h1>
        <p className="mt-1 text-center text-sm text-slate-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {sent ? (
        /* Success state */
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/20">
              <CheckCircle2 className="h-8 w-8 text-teal-400" />
            </div>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-white">Check Your Email</h2>
          <p className="mb-8 text-sm text-slate-400">
            We&apos;ve sent a password reset link to{' '}
            <span className="font-medium text-teal-400">{email}</span>. Please check your inbox and spam folder.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-teal-500/40 hover:brightness-110 active:scale-[0.98]"
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
            className="mt-3 text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
          >
            Try a different email
          </button>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="you@university.edu"
                className={`w-full rounded-lg border bg-slate-800 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:ring-2 ${
                  touched && !emailValid && email.length > 0
                    ? 'border-red-500 focus:ring-red-500/40'
                    : 'border-slate-700 focus:border-teal-500 focus:ring-teal-500/40'
                }`}
              />
            </div>
            {touched && !emailValid && email.length > 0 && (
              <p className="mt-1 text-xs text-red-400">Please enter a valid email address.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:shadow-teal-500/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-teal-500/25 disabled:hover:brightness-100"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </div>
  );
}
