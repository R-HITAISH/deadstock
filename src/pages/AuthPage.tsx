import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from '@/router/Router';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { navigate } = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/account');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <h1 className="font-display text-5xl uppercase mb-2">
        {mode === 'signin' ? 'Sign in' : 'Create account'}
      </h1>
      <p className="font-body text-sm text-muted mb-8">
        {mode === 'signin'
          ? 'Access your order history and saved items.'
          : 'Start buying and tracking one-of-one pieces.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-body text-xs uppercase text-muted block mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase text-muted block mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 border-2 border-error bg-error/10 text-error font-body text-sm">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {mode === 'signin' ? 'Signing in...' : 'Creating...'}
            </>
          ) : mode === 'signin' ? (
            'Sign in'
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        {mode === 'signin' ? (
          <p className="font-body text-sm text-muted">
            No account?{' '}
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className="text-accent hover:underline font-bold"
            >
              Create one
            </button>
          </p>
        ) : (
          <p className="font-body text-sm text-muted">
            Already have an account?{' '}
            <button
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className="text-accent hover:underline font-bold"
            >
              Sign in
            </button>
          </p>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="font-body text-xs uppercase tracking-wider text-muted hover:text-accent">
          Back to home
        </Link>
      </div>
    </div>
  );
}
